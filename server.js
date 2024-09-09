// server.js
const express = require('express');
const { createTradeInfo, verifyPayment } = require('./JS/newebpay.js');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config(); // 加載主環境變數文件
dotenv.config({ path: './.env.links' }); // 加載額外的環境變數文件

const app = express();
const port = process.env.PORT || 3000;

// 設置 nodemailer 的傳輸器

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, // 你的郵件帳號
        pass: process.env.EMAIL_PASS  // 你的郵件密碼或應用程式密碼
    }
});

app.use(express.urlencoded({ extended: true })); // 解析 application/x-www-form-urlencoded 格式的數據
app.use(express.json()); // 解析 application/json 格式的數據
const querystring = require('querystring'); // 導入 querystring 模組

// 支付路由
app.post('/pay', (req, res) => {
    const orderInfo = {
        orderNo: req.body.MerchantOrderNo,
        amount: req.body.Amt,
        description: req.body.ItemDesc,
        email: req.body.Email,
        CustomField1: req.body.CustomField1
    };

    const paymentData = createTradeInfo(orderInfo);
``
    // 動態生成 HTML 表單，並自動提交到藍新金流的支付網關
    const formHTML = `
        <form id="paymentForm" method="POST" action="https://core.newebpay.com/MPG/mpg_gateway" style="display:none;">
            MID: <input type="hidden" name="MerchantID" value="${paymentData.MerchantID}" readonly><br>
            Version: <input type="hidden" name="Version" value="${paymentData.Version}" readonly><br>
            TradeInfo: <input type="hidden" name="TradeInfo" value="${paymentData.TradeInfo}" readonly><br>
            TradeSha: <input type="hidden" name="TradeSha" value="${paymentData.TradeSha}" readonly><br>
        </form>
        <script>
            document.getElementById('paymentForm').submit(); // 自動提交表單
        </script>
    `;
    console.log(paymentData, formHTML);
    res.send(formHTML);
});


// 支付結果回調路由
app.post('/payment-callback', (req, res) => {
    console.log('Received callback data:', req.body);

    const paymentData = req.body; // 使用 express.urlencoded 解析的結果

    if (paymentData.Status === "SUCCESS" && paymentData.TradeInfo) {
        const decryptedData = verifyPayment(paymentData); // 獲取解密後的數據
        if (decryptedData) {
            console.log('Payment verification succeeded');
            console.log(decryptedData.CustomField1);

            const email = decryptedData.CustomField1; // 從自訂欄位中獲取 Email
            const itemDesc = decryptedData.ItemDesc;

            if (email) {
                // 根據 itemDesc 查找對應的下載鏈接
                const downloadLink = process.env[`${itemDesc.toUpperCase()}_LINK`] || process.env.DEFAULT_LINK;

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: '您的訂單已成功付款',
                    text: `感謝您的購買！您可以通過以下鏈結下載您購買的音樂分軌： ${downloadLink}`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('發送郵件時發生錯誤：', error);
                        res.sendStatus(500);
                    } else {
                        console.log('郵件已發送：' + info.response);
                        res.sendStatus(200);
                    }
                });
            } else {
                console.error('無效的電子郵件地址');
                res.sendStatus(400);
            }
        } else {
            console.log('Payment verification failed');
            res.sendStatus(400);
        }
    } else {
        console.log('Invalid payment data format received:', paymentData);
        res.sendStatus(400);
    }
});

app.listen(port, () => {
    console.log(`伺服器正在運行於 http://localhost:${port}`);
});
