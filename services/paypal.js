const paypal = require('@paypal/checkout-server-sdk');
const axios = require('axios');
const dotenv = require('dotenv');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const path = require('path');
const i18n = require('i18n');

dotenv.config();
dotenv.config({ path: './.env.links' });

// 初始化 PayPal
const environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

// 初始化 MongoDB
const uri = process.env.MANGODB_CONNECTION_STRING;
const mongoClient = new MongoClient(uri);

// 簡化版的 connectToDatabase 函數
async function connectToDatabase() {
    if (!mongoClient.topology || !mongoClient.topology.isConnected()) {
        await mongoClient.connect();
    }
}

// 處理 PayPal 支付請求
async function handlePayPalPaymentRequest(req, res) {
    // ... (保持原有的代碼，無需更改)
}

// 處理 PayPal 支付成功
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

        if (capture.result.status === 'COMPLETED') {
            console.log('支付已完成：', capture.result);

            const reference_id = capture.result.purchase_units[0].reference_id;
            const [orderReference, discordId] = reference_id.split('-');
            const totalValue = capture.result.purchase_units[0].amount.value;
            const orderTime = new Date();

            // 連接 MongoDB 資料庫
            await connectToDatabase();
            const db = mongoClient.db('UserManagement');
            const usersCollection = db.collection('Users');

            try {
                const updateResult = await usersCollection.updateOne(
                    { _id: discordId },
                    { $push: { items: { reference_id: orderReference, orderTime } } }
                );

                if (updateResult.modifiedCount > 0) {
                    console.log('用戶資料已更新');
                } else {
                    console.log('未找到用戶或未更新用戶資料');
                }

                // 發送訂單資訊至 Discord Bot
                const downloadLink = process.env[`${orderReference}_LINK`] || process.env.DEFAULT_LINK;
                await axios.post(`${process.env.DISCORD_BOT_API_URL}/order`, {
                    discordID: discordId,
                    reference_id: orderReference,
                    downloadLink: downloadLink
                });
                console.log('訂單訊息已成功發送至 Discord Bot');

                // 送出 GA4 購買事件
                const measurementId = process.env.GA4_measurementId;
                const apiSecret = process.env.GA4_Secret;
                const clientId = crypto.randomUUID();
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

                // 確保資料庫連接關閉
                await mongoClient.close();

                return res.redirect('https://yyrealseer.com/success');
            } catch (error) {
                console.error('更新用戶資料或發送訂單資訊時發生錯誤：', error);
                // 確保在錯誤時關閉資料庫連接
                await mongoClient.close();
                return res.status(500).send('支付成功，但發送訂單資訊或 GA4 事件時出錯');
            }
        } else {
            console.error('捕獲訂單時出錯');
            res.status(500).send('捕獲訂單時出錯');
        }
    } catch (error) {
        console.error('捕獲訂單時出錯：', error);
        // 確保在錯誤時關閉資料庫連接
        await mongoClient.close();
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
