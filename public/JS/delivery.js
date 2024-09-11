const nodemailer = require('nodemailer');
const express = require('express');
const app = express();

// 假設你的回調URL是 https://yourwebsite.com/payment-callback
app.post('/payment-callback', (req, res) => {
    // 解析藍新金流的回傳資料
    const paymentData = req.body;

    // 驗證簽章和付款狀態
    if (isValidPayment(paymentData)) {
        // 根據商品ID查找下載連結
        const downloadLink = getDownloadLink(paymentData.productId);

        // 設置郵件發送器
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'your-email@gmail.com',
                pass: 'your-email-password'
            }
        });

        // 配置電子郵件
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: paymentData.customerEmail,
            subject: 'Your Download Link',
            text: `Thank you for your purchase! Here is your download link: ${downloadLink}`
        };

        // 發送郵件
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Email sent: ' + info.response);
        });
    }
    res.sendStatus(200); // 確認回調通知已處理
});

function isValidPayment(data) {
    // 這裡撰寫驗證簽章和付款狀態的邏輯
    return true; // 假設驗證成功
}

function getDownloadLink(productId) {
    // 模擬從資料庫或文件查找下載連結的邏輯
    const productLinks = {
        'product1': 'https://yourwebsite.com/download/product1.zip',
        'product2': 'https://yourwebsite.com/download/product2.zip',
        'product3': 'https://yourwebsite.com/download/product3.zip',
        // 添加更多商品和其相應的下載連結
    };
    return productLinks[productId] || 'https://yourwebsite.com/download/default.zip';
}

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
