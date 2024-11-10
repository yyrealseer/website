const paypal = require('@paypal/checkout-server-sdk');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const i18n = require('i18n');

dotenv.config();
dotenv.config({ path: './.env.links' });

// 初始化 PayPal
const environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

// 處理 PayPal 支付請求
async function handlePayPalPaymentRequest(req, res) {
    console.log('收到的 PayPal 支付請求數據:', JSON.stringify(req.body, null, 2));

    const orderInfo = {
        invoiceId: req.body.invoiceId,
        currency: req.body.currency,
        amount: parseFloat(req.body.amount).toFixed(2),
        reference_id: req.body.description,
        discordId: req.body.discordId
    };

    // 檢查幣別和金額
    if (!orderInfo.currency || !orderInfo.amount || isNaN(orderInfo.amount)) {
        console.log('無效的金額或幣別:', orderInfo.currency, orderInfo.amount);
        return res.status(400).send('幣別和金額為必填欄位，且金額必須為有效的數字（例如：currency: "TWD", amount: "50.00"）。');
    }

    // 構建訂單請求
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            reference_id: `${orderInfo.reference_id}-${orderInfo.discordId}`,
            amount: {
                currency_code: orderInfo.currency,
                value: orderInfo.amount
            },
            description: orderInfo.description || ''
        }],
        application_context: {
            return_url: `${req.protocol}://${req.get('host')}/paypal-success`,
            cancel_url: `${req.protocol}://${req.get('host')}/paypal-cancel`,
            shipping_preference: 'NO_SHIPPING'
        }
    });

    try {
        const order = await client.execute(request);
        // 確保 PayPal 回傳成功，並引導用戶進行支付
        res.redirect(303, order.result.links.find(link => link.rel === 'approve').href);
    } catch (error) {
        console.error('創建 PayPal 訂單時出錯：', error.message);
        res.status(500).send('創建 PayPal 訂單時出錯');
    }
}

async function handlePayPalPaymentSuccess(req, res) {
    const { token, PayerID } = req.query;

    if (!token || !PayerID) {
        console.error('支付成功回調參數缺失');
        return res.status(400).send('支付成功回調參數缺失');
    }

    const userLocale = req.cookies.i18n || 'zh';
    req.setLocale(userLocale);

    try {
        // 捕獲支付
        const request = new paypal.orders.OrdersCaptureRequest(token);
        request.requestBody({});
        const capture = await client.execute(request);

        // 檢查支付是否完成
        if (capture.result.status === 'COMPLETED') {
            console.log('支付已完成：', capture.result);

            const reference_id = capture.result.purchase_units[0].reference_id;
            const [orderReference, discordId] = reference_id.split('-');

            // 進一步檢查金額
            const amountData = capture.result.purchase_units[0].amount;
            if (!amountData || !amountData.value) {
                console.error('缺少金額資訊', amountData);
                return res.status(500).send('缺少金額資訊');
            }

            const totalValue = parseFloat(amountData.value);

            // 預設下載連結
            const downloadLink = process.env[`${orderReference}_LINK`] || process.env.DEFAULT_LINK;

            // 發送訂單資訊至 Discord Bot
            try {
                await axios.post(`${process.env.DISCORD_BOT_API_URL}/order`, {
                    discordID: discordId,
                    reference_id: orderReference,
                    downloadLink: downloadLink,
                });
                console.log('訂單訊息已成功發送至 Discord Bot');

                // 送出 GA4 購買事件
                const measurementId = process.env.GA4_measurementId;
                const apiSecret = process.env.GA4_Secret;
                const clientId = req.body.client_id || 'default_client_id';
                const transactionId = capture.result.id;

                const ga4Payload = {
                    client_id: clientId,
                    events: [
                        {
                            name: 'purchase',
                            params: {
                                transaction_id: transactionId,
                                affiliation: 'Online Store',
                                value: totalValue,
                                currency: 'USD',
                                items: [
                                    {
                                        item_name: orderReference,
                                        item_id: orderReference,
                                        price: totalValue,
                                        quantity: 1
                                    }
                                ]
                            }
                        }
                    ]
                };

                await axios.post(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, ga4Payload);
                console.log('GA4 購買事件已發送');

                return res.redirect('https://yyrealseer.com/success');
            } catch (error) {
                console.error('發送郵件或 GA4 事件時發生錯誤：', error.response?.data || error);
                return res.status(500).send('支付成功，但發送郵件或 GA4 事件時出錯');
            }
        }
    } catch (error) {
        console.error('捕獲訂單時出錯：', error);
        return res.status(500).send('捕獲訂單時出錯');
    }
}
// 處理支付取消回調
function handlePaymentCancel(req, res) {
    res.send('支付已取消');
}

module.exports = {
    handlePayPalPaymentRequest,
    handlePayPalPaymentSuccess,
    handlePaymentCancel
};
