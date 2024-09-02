// newebpay.js
const NewebPay = require('node-newebpay'); // 使用 require 導入模組
const dotenv = require('dotenv');

dotenv.config(); // 加載 .env 文件中的環境變數

// 使用環境變量中的密鑰和 IV 來創建 NewebPay 實例
const newebpay = NewebPay(process.env.NEWEBPAY_HASH_KEY, process.env.NEWEBPAY_HASH_IV);

// 生成交易資料
function createTradeInfo(orderInfo) {
    const tradeInfo = {
        MerchantID: process.env.NEWEBPAY_MERCHANT_ID,
        RespondType: 'JSON',
        TimeStamp: Date.now().toString(),
        Version: '1.5',
        MerchantOrderNo: orderInfo.orderNo,
        Amt: orderInfo.amount,
        ItemDesc: orderInfo.description,
        Email: orderInfo.email
    };

    // 將交易資料進行 AES 加密
    const encryptedTradeInfo = newebpay.TradeInfo(tradeInfo).encrypt();

    // 使用加密後的交易資料進行 SHA256 檢查碼生成
    const tradeSha = newebpay.TradeInfo(encryptedTradeInfo).TradeSha();

    return {
        MerchantID: tradeInfo.MerchantID,
        TradeInfo: encryptedTradeInfo,
        TradeSha: tradeSha,
        Version: tradeInfo.Version
    };
}

// 導出函數供其他文件使用
module.exports = { createTradeInfo, verifyPayment };