const express = require('express');
const cookieParser = require('cookie-parser');
const i18n = require('i18n');
const { handlePayPalPaymentRequest, handlePayPalPaymentSuccess, handlePaymentCancel } = require('./services/paypal');
const ecpayRouter = require('./services/ecpay');
const dotenv = require('dotenv');
const path = require('path'); 
const fs = require('fs'); // 引入 fs 模組

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

// 路由定義
app.get('/', (req, res) => {
    res.render('index', {
        title: i18n.__('index.meta_title'),
        description: i18n.__('index.meta_description'),
        t: i18n.__,
        currentLocale: res.getLocale()
    });
});

// 提供 sitemap.xml 路由
app.get('/sitemap.xml', (req, res) => {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
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
        currentLocale: res.getLocale(),
        beatsData: beatsData // 將 beatsData 傳遞給模板
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

app.get('/articles/:id', (req, res) => {
    const articleId = req.params.id;
    const article = getArticleById(articleId);

    if (!article) {
        return res.status(404).send('文章未找到');
    }

    res.render('article', {
        article: article,
        t: i18n.__, // 正確傳遞 i18n.__ 作為翻譯函數
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
