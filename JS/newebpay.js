const crypto = require('crypto');

// 組合交易資料字串
const tradeInfo = {
  MerchantID: '你的商店代號',
  RespondType: 'JSON',
  TimeStamp: Date.now().toString(),
  Version: '1.5',
  MerchantOrderNo: '你的訂單編號',
  Amt: 100,
  ItemDesc: '商品描述',
  Email: 'customer@example.com'
};

// 建立交易資料字串
const queryString = Object.keys(tradeInfo)
  .map(key => `${key}=${tradeInfo[key]}`)
  .join('&');

// 加密交易資料字串
const encryptedTradeInfo = crypto.createCipheriv('aes-256-cbc', Buffer.from('你的密鑰', 'utf8'), Buffer.from('iv', 'utf8'))
  .update(queryString, 'utf8', 'hex') + cipher.final('hex');

// 將加密後的結果發送到藍新金流API

app.post('/payment-callback', (req, res) => {
    const paymentData = req.body;
    
    // 驗證簽章
    const isValid = verifySignature(paymentData);
    
    if (isValid) {
        // 確認交易成功，處理業務邏輯
        res.sendStatus(200);  // 回應藍新金流，表示通知已收到
    } else {
        res.sendStatus(400);  // 回應錯誤
    }
});

function verifySignature(data) {
    // 進行簽章驗證的邏輯
    return true; // 假設驗證成功
}