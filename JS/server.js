// server.js

// 引入Express模組
const express = require('express');

// 創建Express應用實例
const app = express();

// 設定伺服器端口
const port = process.env.PORT || 3000;

// 處理靜態文件的中間件（可選）
app.use(express.static('public'));

// 解析JSON請求的中間件
app.use(express.json());

// 定義基本路由
app.get('/', (req, res) => {
  res.send('Hello World! 這是一個基本的Node.js伺服器');
});

// 啟動伺服器
app.listen(port, () => {
  console.log(`伺服器正在運行於 http://${port}`);
});