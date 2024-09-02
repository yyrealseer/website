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

        // 檢查解密後的數據是否合法
        if (resultObj && resultObj.Status === 'SUCCESS') {
            // 交易成功
            return true;
        } else {
            // 交易失敗或數據不合法
            return false;
        }
    } catch (error) {
        console.error('解密或驗證支付結果時發生錯誤:', error);
        return false; // 發生錯誤時返回 false
    }
}

// 導出函數供其他文件使用
module.exports = { createTradeInfo, verifyPayment };

// 測試代碼 (可選)
if (require.main === module) {
    // 創建測試的 orderInfo
    const testOrderInfo = {
        orderNo: '24/08/22',
        amount: 500,
        description: 'Neo-soul',
        email: 'xavier890930@gmail.com'
    };

    // 測試 createTradeInfo 函數
    const paymentData = createTradeInfo(testOrderInfo);
    console.log('生成的交易資料:', paymentData);

    // 模擬測試支付結果
    const testPaymentData = { ...paymentData, Status: 'SUCCESS' }; // 假設支付成功
    const isValid = verifyPayment(testPaymentData);
    console.log('驗證支付結果:', isValid);
}
