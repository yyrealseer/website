const paypal = require('@paypal/checkout-server-sdk');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const i18n = require('i18n');

dotenv.config();
dotenv.config({ path: './.env.links' });

// 初始化 PayPal
const environment = new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

// 設置 nodemailer 的傳輸器
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 處理 PayPal 支付請求
async function handlePayPalPaymentRequest(req, res) {
    console.log('收到的 PayPal 支付請求數據:', JSON.stringify(req.body, null, 2));
    const orderInfo = {
        invoiceId: req.body.invoice_id,
        currency: req.body.currency,
        amount: parseFloat(req.body.amount).toFixed(2),
        reference_id: req.body.description,
        email: req.body.Email,
    };

    if (!orderInfo.currency || !orderInfo.amount || isNaN(orderInfo.amount)) {
        console.log('無效的金額或幣別:', orderInfo.currency, orderInfo.amount);
        return res.status(400).send('幣別和金額為必填欄位，且金額必須為有效的數字（例如：currency: "TWD", amount: "50.00"）。');
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            reference_id: orderInfo.reference_id,
            amount: {
                currency_code: orderInfo.currency,
                value: parseFloat(orderInfo.amount).toFixed(2)
            },
            description: orderInfo.description
        }],
        application_context: {
            return_url: `${req.protocol}://${req.get('host')}/paypal-success`,
            cancel_url: `${req.protocol}://${req.get('host')}/paypal-cancel`,
            shipping_preference: 'NO_SHIPPING'
        }
    });

    try {
        const order = await client.execute(request);
        res.redirect(303, order.result.links.find(link => link.rel === 'approve').href);
    } catch (error) {
        console.error('創建 PayPal 訂單時出錯：', error.message);
        res.status(500).send('創建 PayPal 訂單時出錯');
    }
}

// 處理支付成功回調
async function handlePayPalPaymentSuccess(req, res) {
    const { token, PayerID } = req.query;

    if (!token || !PayerID) {
        console.error('支付成功回調參數缺失');
        return res.status(400).send('支付成功回調參數缺失');
    }

    // 設定語言，根據用戶的偏好或請求中的信息（例如：根據URL、Cookie或其他方式設置語言）
    const userLocale = req.cookies.i18n || 'zh'; // 假設默認為中文，如果有語言Cookie則使用其值
    req.setLocale(userLocale); // 使用 req.setLocale 設定語言

    try {
        const request = new paypal.orders.OrdersCaptureRequest(token);
        request.requestBody({});
        const capture = await client.execute(request);

        if (capture.result.status === 'COMPLETED') {
            console.log('支付已完成：', capture.result);
            res.redirect('https://yyrealseer.com/success');

            const reference_id = capture.result.purchase_units[0].reference_id;
            const Email = capture.result.payer.email_address;
            const downloadLink = process.env[`${reference_id}_LINK`] || process.env.DEFAULT_LINK;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: Email,
                subject: req.__('success_email.title'), // 使用 req.__ 獲取 subject
                text: `${req.__('success_email.content')} ${downloadLink}`, // 使用 req.__ 獲取 text
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('發送郵件時發生錯誤：', error);
                    return res.status(500).send('支付成功，但發送郵件時出錯');
                } else {
                    console.log('確認郵件已發送：' + info.response);
                    return res.sendFile(path.join(__dirname, 'https://yyrealseer.com/success'));
                }
            });
        } else {
            console.error('支付未完成');
            res.status(400).send('支付未完成');
        }
    } catch (error) {
        console.error('捕獲訂單時出錯：', error);
        res.status(500).send('捕獲訂單時出錯');
    }
}

// 處理支付取消回調
function handlePaymentCancel(req, res) {
    res.send('支付已取消');
}

// 導出函數
module.exports = {
    handlePayPalPaymentRequest,
    handlePayPalPaymentSuccess,
    handlePaymentCancel
};