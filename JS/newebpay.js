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
        Version: '2.0',
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

// 確認交易狀態
const querystring = require('querystring'); // 導入 querystring 模組

function verifyPayment(paymentData) {
    try {
        // 提取加密的 TradeInfo 部分
        const encryptedTradeInfo = paymentData.TradeInfo;

        // 解密支付結果數據
        const decryptedData = newebpay.TradeInfo(encryptedTradeInfo).decrypt();

        // 將解密後的查詢字符串轉換為對象
        const resultObj = querystring.parse(decryptedData);

        console.log('解密後的數據:', resultObj); // 打印解密後的數據來調試

        // 返回解密後的結果
        return resultObj;
    } catch (error) {
        console.error('解密或驗證支付結果時發生錯誤:', error);
        return null; // 發生錯誤時返回 null
    }
}

// 導出函數供其他文件使用
module.exports = { createTradeInfo, verifyPayment };

// 測試代碼 (可選)
if (require.main === module) {
    // 創建測試的 orderInfo
    const testOrderInfo = {
        orderNo: '20240909',        // 測試訂單號碼
        amount: 3000,               // 測試金額
        description: 'RazorRush',   // 測試商品描述
        email: 'william711@kimo.com' // 測試用戶的電子郵件
    };

    // 使用 createTradeInfo 函數生成交易資料
    const paymentData = createTradeInfo(testOrderInfo);
    console.log('生成的交易資料:', paymentData); // 打印生成的交易資料以調試

    // 模擬支付結果回調的數據
    const paymentCallbackData = {
        Status: "SUCCESS",
        TradeInfo: paymentData.TradeInfo,
        TradeSha: paymentData.TradeSha
    };

    // 測試 verifyPayment 函數
    const isValid = verifyPayment(paymentCallbackData);
    console.log('驗證支付結果:', isValid); // 打印驗證支付結果來調試
}