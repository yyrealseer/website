const express = require('express');
const paypal = require('@paypal/checkout-server-sdk');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config(); // 加載環境變數文件
dotenv.config({ path: './.env.links' }); // 加載額外的環境變數文件

const app = express();
const port = process.env.PORT || 3000;

// PayPal SDK 配置
const environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET); // 使用沙盒環境
const client = new paypal.core.PayPalHttpClient(environment);

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

// 設置中間件以解析不同類型的數據
app.use(express.urlencoded({ extended: true })); // 支持 urlencoded 格式
app.use(express.json()); // 支持 json 格式

// 支付路由
app.post('/pay', async (req, res) => {
    console.log('收到的請求數據:', JSON.stringify(req.body, null, 2)); // 使用 JSON.stringify 展開完整的請求數據
    const orderInfo = {
        invoiceId: req.body.invoice_id,  // 使用 invoice_id 存儲訂單號碼
        currency: req.body.currency,     // 單獨傳遞幣別
        amount: req.body.amount,         // 單獨傳遞金額
        description: req.body.ItemDesc,
        email: req.body.Email,
    };

    // 檢查幣別和金額是否存在且有效
    if (!orderInfo.currency || !orderInfo.amount || isNaN(orderInfo.amount)) {
        console.log('無效的金額或幣別:', orderInfo.currency, orderInfo.amount);
        return res.status(400).send('幣別和金額為必填欄位，且金額必須為有效的數字（例如：currency: "TWD", amount: "50.00"）。');
    }

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
            reference_id: orderInfo.invoiceId,  // 使用 reference_id 或 invoice_id
            amount: {
                currency_code: orderInfo.currency, // 設置幣別（例如 TWD）
                value: parseFloat(orderInfo.amount).toFixed(2) // 金額需要轉換為字符串，且保持兩位小數
            },
            description: orderInfo.description // 商品描述
        }],
        application_context: {
            return_url: `${req.protocol}://${req.get('host')}/payment-success`,
            cancel_url: `${req.protocol}://${req.get('host')}/payment-cancel`,
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
});

// 支付成功回調路由
app.post('/payment-success', async (req, res) => {
    console.log('收到的支付成功回調數據:', JSON.stringify(req.body, null, 2));

    const { invoice_id, currency, amount, ItemDesc, Email } = req.body;

    // 在此處你可以檢查接收到的回調數據的有效性和完整性
    if (!invoice_id || !currency || !amount || !ItemDesc || !Email) {
        console.error('支付回調數據缺失');
        return res.status(400).send('無效的支付回調數據');
    }

    try {
        // 更新訂單狀態，發送確認郵件，或執行其他業務邏輯

        // 構造下載鏈接（需要根據你的業務邏輯進行修改）
        const downloadLink = process.env[`${ItemDesc.toUpperCase()}_LINK`] || process.env.DEFAULT_LINK;

        // 發送確認郵件
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: Email,
            subject: '您的訂單已成功付款',
            text: `感謝您的購買！您可以通過以下鏈接下載您購買的音樂分軌： ${downloadLink}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('發送郵件時發生錯誤：', error);
                return res.status(500).send('支付成功，但發送郵件時出錯');
            } else {
                console.log('確認郵件已發送：' + info.response);
                return res.status(200).send('支付成功，確認郵件已發送');
            }
        });
    } catch (error) {
        console.error('處理支付成功回調時出錯：', error);
        res.status(500).send('處理支付成功回調時出錯');
    }
});

// 支付取消回調路由
app.get('/payment-cancel', (req, res) => {
    res.send('支付已取消');
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器正在運行於 http://localhost:${port}`);
});
