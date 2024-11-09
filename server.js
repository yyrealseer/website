// #region 引入模組
const express = require('express');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const i18n = require('i18n');
const { handlePayPalPaymentRequest, handlePayPalPaymentSuccess, handlePaymentCancel } = require('./services/paypal');

const ecpayRouter = require('./services/ecpay');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs'); // 引入 fs 模組

dotenv.config();
// #endregion

// #region 創建 Express 應用程序及加載環境變數
const app = express();
const port = process.env.PORT || 3000;

dotenv.config(); // 加載環境變數文件
dotenv.config({ path: './.env.links' });
// #endregion

// #region 中介軟體配置
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
// #endregion

// #region 靜態資源及模板引擎設定
// 設置靜態資源文件夾
app.use(express.static(__dirname + '/public'));

// 設定 EJS 為模板引擎
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// #endregion

// #region Discord 登入系統設定
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback';

// 引導用戶至 Discord 登入頁面
app.get('/login', (req, res) => {
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(discordAuthUrl);
});

// 處理 Discord 回調
app.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        // 用 `code` 換取 `access_token`
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;

        // 使用 `access_token` 獲取用戶資料
        const userDataResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        // 把用戶資料作為參數傳給前端，並重定向至首頁
        const userData = JSON.stringify(userDataResponse.data);
        res.redirect(`/?user=${encodeURIComponent(userData)}`);

    } catch (error) {
        console.error('Error fetching user data:', error.response ? error.response.data : error.message);
        console.log(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);  // 確認 ID、密碼、和重定向 URI
        res.status(500).json({ error: '獲取用戶資料失敗', details: error.response ? error.response.data : error.message });
    }
});

// #endregion

// #region 主頁及多語系路由

// 路由處理語言切換
app.get('/change-language/:lang', (req, res) => {
    const lang = req.params.lang;
    res.setLocale(lang);
    res.cookie('i18n', lang);
    const backURL = req.header('Referer') || '/';
    res.redirect(backURL);
});
// #endregion

// #region 資料處理及靜態頁面渲染路由
// 讀取文章數據
const getArticles = () => {
    const data = fs.readFileSync(path.join(__dirname, './data/articles.json'), 'utf-8');
    return JSON.parse(data);
};

// 根據 id 查詢文章
const getArticleById = (id) => {
    const articles = getArticles();
    return articles.find(article => article.id === id);
};

// 加載 JSON 文件
const beatsData = Object.values(JSON.parse(fs.readFileSync('./data/BeatsHouseware.json', 'utf-8'))).reverse();

// 靜態頁面路由
app.get('/', (req, res) => {
    res.render('index', {
        title: i18n.__('index.meta_title'),
        description: i18n.__('index.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});

// 各頁面路由（如: BeatMarket, Collaborate, Course, Production, FAQ, Mixing, Success）
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
        currentLocale: res.getLocale(),
        beatsData: beatsData // 傳遞 beatsData
    });
});

// 文章頁面路由
app.get('/articles', (req, res) => {
    let articles = getArticles(); // 從 JSON 文件讀取所有文章

    // 根據日期排序（新到舊）
    articles = articles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 過濾分類（如果有傳入 category 參數）
    if (req.query.category) {
        articles = articles.filter(article => article.category === req.query.category);
    }

    // 渲染模板，並傳遞翻譯函數和文章數據
    res.render('articlesIndex', {
        articles: articles,
        t: i18n.__, // 正確傳遞 i18n.__ 作為翻譯函數
        currentLocale: res.getLocale()
    });
});
// #endregion

// #region 支付系統路由
app.post('/paypal-pay', handlePayPalPaymentRequest);
app.get('/paypal-success', handlePayPalPaymentSuccess);
app.get('/paypal-cancel', handlePaymentCancel);

// 使用綠界支付路由
app.use('/', ecpayRouter);
// #endregion

// #region 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器正在運行於 http://localhost:${port}`);
});
// #endregion
