const express = require('express');
const cookieParser = require('cookie-parser');
const i18n = require('i18n');
const paypal = require('@paypal/checkout-server-sdk');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path'); // 引入 path 模塊

// 創建 Express 應用程序
const app = express();
const port = process.env.PORT || 3000;

// 加載環境變數文件
dotenv.config();
dotenv.config({ path: './.env.links' });

// 使用 cookie-parser 中介軟體
app.use(cookieParser());

// 配置 i18n
i18n.configure({
    locales: ['en', 'zh'],
    directory: __dirname + '/locales',
    defaultLocale: 'zh',
    objectNotation: true,
    register: global,
    autoReload: true, // 啟用自動重載
    updateFiles: false
});

// 初始化 i18n 中介軟體
app.use(i18n.init);

// 自定義中介軟體來檢查和設置語言偏好
app.use((req, res, next) => {
    const lang = req.cookies.i18n || 'zh'; // 默認語言為中文
    res.setLocale(lang);
    next();
});

// 設置靜態資源文件夾
app.use(express.static(__dirname + '/public'));

// 路由處理語言切換
app.get('/change-language/:lang', (req, res) => {
    const lang = req.params.lang;
    res.setLocale(lang);
    res.cookie('i18n', lang);
    const backURL = req.header('Referer') || '/';
    res.redirect(backURL);
});

// 設定 EJS 為模板引擎
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// 路由定義
app.get('/', (req, res) => {
    res.render('index', {
        title: i18n.__('index.meta_title'),
        description: i18n.__('index.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});
app.get('/arrange', (req, res) => {
    res.render('arrange', {
        title: i18n.__('arrange.meta_title'),
        description: i18n.__('arrange.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});
app.get('/BeatMarket', (req, res) => {
    res.render('BeatMarket', {
        title: i18n.__('BeatMarket.meta_title'),
        description: i18n.__('BeatMarket.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});
app.get('/collaborate', (req, res) => {
    res.render('collaborate', {
        title: i18n.__('collaborate.meta_title'),
        description: i18n.__('collaborate.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});
app.get('/course', (req, res) => {
    res.render('course', {
        title: i18n.__('course.meta_title'),
        description: i18n.__('course.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});
app.get('/production', (req, res) => {
    res.render('production', {
        title: i18n.__('production.meta_title'),
        description: i18n.__('production.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});
app.get('/FAQ', (req, res) => {
    res.render('FAQ', {
        title: i18n.__('FAQ.meta_title'),
        description: i18n.__('FAQ.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});
app.get('/mixing', (req, res) => {
    res.render('mixing', {
        title: i18n.__('mixing.meta_title'),
        description: i18n.__('mixing.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});
app.get('/success', (req, res) => {
    res.render('success', {
        title: i18n.__('success.meta_title'),
        description: i18n.__('success.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});

// PayPal SDK 配置
const environment = new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET); // 使用沙盒/正式環境
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

// 中間件
app.use(express.urlencoded({ extended: true })); // 支持 urlencoded 格式
app.use(express.json()); // 支持 json 格式
// #endregion

// #region 路由處理函數
// 處理支付請求
async function handlePaymentRequest(req, res) {
    console.log('收到的請求數據:', JSON.stringify(req.body, null, 2));
    const orderInfo = {
        invoiceId: req.body.invoice_id,
        currency: req.body.currency,
        amount: req.body.amount,
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
}

// 處理支付成功回調
async function handlePaymentSuccess(req, res) {
    const { token, PayerID } = req.query;

    if (!token || !PayerID) {
        console.error('支付成功回調參數缺失');
        return res.status(400).send('支付成功回調參數缺失');
    }

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
                subject: 'YY Studio | 您的訂單已成功付款',
                text: `感謝您的購買！您可以通過以下鏈接下載您購買的音樂分軌： ${downloadLink}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('發送郵件時發生錯誤：', error);
                    return res.status(500).send('支付成功，但發送郵件時出錯');
                } else {
                    console.log('確認郵件已發送：' + info.response);
                    return res.sendFile(path.join(__dirname, 'payment-success.html'));
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
// #endregion

// #region 路由定義
app.post('/paypal-pay', handlePaymentRequest);
app.get('/payment-success', handlePaymentSuccess);
app.get('/payment-cancel', handlePaymentCancel);
// #endregion

// #region 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器正在運行於 http://localhost:${port}`);
});
// #endregion
