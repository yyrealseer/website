// newebpay.js
const { NewebPay } = require('node-newebpay');

// 設置 NewebPay 參數
const newebpay = new NewebPay({
    MerchantID: 'MS1754248462',
    HashKey: 'vhOOs8EnhHYuHBwuVA98H4Y2eftOT6Hi',
    HashIV: 'P8AplVZ20OoLp5qC'
});

// 生成交易資料
export function createTradeInfo(orderInfo) {
    const tradeInfo = {
        MerchantID: 'MS1754248462',
        RespondType: 'JSON',
        TimeStamp: Date.now().toString(),
        Version: '1.5',
        MerchantOrderNo: orderInfo.orderNo,
        Amt: orderInfo.amount,
        ItemDesc: orderInfo.description,
        Email: orderInfo.email
    };

    const encryptedTradeInfo = newebpay.createMpgAesEncrypt(tradeInfo);
    const tradeSha = newebpay.createMpgShaEncrypt(encryptedTradeInfo);

    return {
        MerchantID: tradeInfo.MerchantID,
        TradeInfo: encryptedTradeInfo,
        TradeSha: tradeSha,
        Version: tradeInfo.Version
    };
}

// 驗證支付結果
export function verifyPayment(paymentData) {
    return newebpay.verifyPaymentResult(paymentData);
}