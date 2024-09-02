// server.js
const express = require('express'); // 使用 require 語法
const { createTradeInfo, verifyPayment } = require('./JS/newebpay.js'); // 引入新創建的支付模塊

const app = express();
const port = process.env.PORT || 3000;

// 支付路由
app.post('/pay', (req, res) => {
    const orderInfo = {
        orderNo: '你的訂單編號',
        amount: 100, // 商品金額
        description: '商品描述',
        email: 'customer@example.com'
    };

    const paymentData = createTradeInfo(orderInfo);
    res.json(paymentData); // 將交易資料返回給前端
});

// 支付結果回調路由
app.post('/payment-callback', (req, res) => {
    const paymentData = req.body;

    if (verifyPayment(paymentData)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`伺服器正在運行於 http://localhost:${port}`);
});