// 使用 import 代替 require
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World! 這是一個基本的Node.js伺服器');
});

app.listen(port, () => {
  console.log(`伺服器正在運行於 http://localhost:${port}`);
});