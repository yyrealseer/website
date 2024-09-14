const express = require('express');
const cookieParser = require('cookie-parser');
const i18n = require('i18n');
const { handlePayPalPaymentRequest, handlePayPalPaymentSuccess, handlePaymentCancel } = require('./services/paypal');

// 引入 ecpay.js 文件中的路由模組
const ecpayRouter = require('./services/ecpay');

const dotenv = require('dotenv');
const path = require('path'); 

// 創建 Express 應用程序
const app = express();
const port = process.env.PORT || 3000;

dotenv.config(); // 加載環境變數文件
dotenv.config({ path: './.env.links' });

// 添加解析中介軟件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 使用 cookie-parser 中介軟體
app.use(cookieParser());

// 配置 i18n
i18n.configure({
    locales: ['en', 'zh'],
    directory: __dirname + '/locales',
    defaultLocale: 'zh',
    objectNotation: true,
    register: global,
    autoReload: true,
    updateFiles: false
});

// 初始化 i18n 中介軟體
app.use(i18n.init);

// 自定義中介軟體來檢查和設置語言偏好
app.use((req, res, next) => {
    const lang = req.cookies.i18n || 'zh';
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


// #region 路由定義
app.post('/paypal-pay', handlePayPalPaymentRequest);
app.get('/paypal-success', handlePayPalPaymentSuccess);
app.get('/paypal-cancel', handlePaymentCancel);

// 使用綠界支付路由
app.use('/', ecpayRouter);

// #region 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器正在運行於 http://localhost:${port}`);
});
// #endregion
