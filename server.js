// server.js
const express = require('express');
const { createTradeInfo, verifyPayment } = require('./JS/newebpay.js');

const app = express();
const port = process.env.PORT || 3000;

// 使用 express.json() 和 express.urlencoded() 中間件來解析 JSON 和表單格式的請求
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // 解析 application/x-www-form-urlencoded 格式的數據

// 支付路由
app.post('/pay', (req, res) => {
    const orderInfo = {
        orderNo: '你的訂單編號',
        amount: 100,
        description: '商品描述',
        email: 'customer@example.com'
    };

    const paymentData = createTradeInfo(orderInfo);

    // 發送 POST 請求到藍新金流的支付網關
    axios.post('https://core.newebpay.com/MPG/mpg_gateway', paymentData)
        .then(response => {
            console.log('支付網關的響應：', response.data);
            res.json(response.data); // 返回支付結果給客戶端
        })
        .catch(error => {
            console.error('支付請求出錯：', error);
            res.status(500).send('支付請求失敗');
        });
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
