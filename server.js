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
        orderNo: req.body.MerchantOrderNo,,
        amount: req.body.Amt,
        description: req.body.ItemDesc,
        email: req.body.Email
    };

    const paymentData = createTradeInfo(orderInfo);

    // 動態生成 HTML 表單，並自動提交到藍新金流的支付網關
    const formHTML = `
        <form id="paymentForm" method="POST" action="https://core.newebpay.com/MPG/mpg_gateway">
            MID: <input type="hidden" name="MerchantID" value="${paymentData.MerchantID}" readonly>
            Version: <input type="hidden" name="Version" value="${paymentData.Version}" readonly>
            TradeInfo: <input type="hidden" name="TradeInfo" value="${paymentData.TradeInfo}" readonly>
            TradeSha: <input type="hidden" name="TradeSha" value="${paymentData.TradeSha}" readonly>
        </form>
        <script>
            document.getElementById('paymentForm').submit(); // 自動提交表單
        </script>
    `;
    res.send(formHTML);
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
