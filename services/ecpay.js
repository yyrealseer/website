const { MongoClient } = require('mongodb');
const express = require('express');
const axios = require('axios');
const router = express.Router();
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: './.env.links' });

// 綠界提供的 SDK
const ecpay_payment = require('./ECPAY_Payment_node_js/index');

// 初始化
const options = {
  OperationMode: 'Test', // Test or Production
  MercProfile: {
    MerchantID: process.env.ECPAY_MERCHANT_ID,
    HashKey: process.env.ECPAY_HASH_KEY,
    HashIV: process.env.ECPAY_HASH_IV,
  },
  IgnorePayment: [],
  IsProjectContractor: false,
};

// MongoDB
const uri = process.env.MANGODB_CONNECTION_STRING;
const client = new MongoClient(uri);

async function connectToDatabase() {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
}

// 處理 ECPay 支付請求
router.post('/ecpay-pay', (req, res) => {
  const now = new Date();
  const MerchantTradeDate = now.getFullYear() + '/' +
    ('0' + (now.getMonth() + 1)).slice(-2) + '/' +
    ('0' + now.getDate()).slice(-2) + ' ' +
    ('0' + now.getHours()).slice(-2) + ':' +
    ('0' + now.getMinutes()).slice(-2) + ':' +
    ('0' + now.getSeconds()).slice(-2);

  const TradeNo = 'EC' + now.getTime();
  let base_param = {
    MerchantTradeNo: TradeNo,
    TotalAmount: parseInt(req.body.amount, 10).toString(), // 確保金額是整數且為字串格式
    TradeDesc: encodeURIComponent(req.body.invoiceId.trim()), // URL編碼
    ItemName: encodeURIComponent(req.body.description.trim()), // URL編碼
    CustomField1: encodeURIComponent(req.body.discordId.trim()),
    CustomField2: encodeURIComponent(req.body.description.trim()),// URL編碼
    MerchantTradeDate: MerchantTradeDate,
    PaymentType: 'aio',
    ReturnURL: `https://${req.get('host')}/ecpay-return`,
    ClientBackURL: `https://${req.get('host')}/success`,
    ChoosePayment: 'ALL',
    EncryptType: 1,
  };

  const create = new ecpay_payment(options);

  // 正確生成 CheckMacValue
  const html = create.payment_client.aio_check_out_all(base_param);
  console.log(html);

  res.send(html);
});

// 處理支付成功回調
router.post('/ecpay-return', async (req, res) => {
  console.log('req.body:', req.body);

  const { CheckMacValue } = req.body;
  const data = { ...req.body };
  delete data.CheckMacValue;

  try {
    const create = new ecpay_payment(options);
    const checkValue = create.payment_client.helper.gen_chk_mac_value(data);

    if (CheckMacValue === checkValue) {
      console.log('交易成功，驗證通過：', data);

      const discordID = decodeURIComponent(data.CustomField1);
      const reference_id = data.CustomField2;
      const orderTime = new Date();

      // 連接 MongoDB 資料庫
      await connectToDatabase();
      const db = client.db('UserManagement');
      const usersCollection = db.collection('Users');

      try {
        const updateResult = await usersCollection.updateOne(
          { _id: discordID },
          {
            $push: {
              Purchased: {
                item: reference_id, ordertime: orderTime
              }
            }
          }
        );

        if (updateResult.modifiedCount > 0) {
          console.log('用戶資料已更新');
        } else {
          console.log('未找到用戶或未更新用戶資料');
        }

        // 發送訂單資訊到 Discord Bot 的 API
        // 獲取下載連結
        const downloadLink = process.env[`${reference_id}_LINK`] || process.env.DEFAULT_LINK;

        try {
          await axios.post(`${process.env.DISCORD_BOT_API_URL}/order`, {
            discordID: discordID,
            reference_id: reference_id,
            downloadLink: downloadLink,
          });

          console.log('訂單訊息已成功發送至 Discord Bot');

          // GA4 購買事件
          const measurementId = process.env.GA4_measurementId;
          const apiSecret = process.env.GA4_Secret;
          const clientId = crypto.randomUUID();
          const transactionId = data.MerchantTradeNo;
          const totalValue = parseFloat(data.TradeAmt);

          const ga4Payload = {
            client_id: clientId,
            events: [
              {
                name: 'purchase',
                params: {
                  transaction_id: transactionId,
                  affiliation: 'Online Store',
                  value: totalValue,
                  currency: 'TWD',
                  items: [{ item_name: reference_id, item_id: reference_id, price: totalValue, quantity: 1 }]
                }
              }
            ]
          };

          await axios.post(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, ga4Payload);
          console.log('GA4 購買事件已發送');

          // 確保資料庫連接關閉
          await client.close();

          return res.send('1|OK');
        } catch (error) {
          console.error('發送訂單訊息或 GA4 事件時發生錯誤：', error);
          return res.status(500).send('支付成功，但處理時發生錯誤');
        }
      } catch (error) {
        console.error('更新用戶資料或發送訂單訊息時發生錯誤：', error);
        return res.status(500).send('支付成功，但處理時發生錯誤');
      }
    } else {
      console.error('支付驗證失敗');
      res.status(400).send('支付驗證失敗');
    }
  } catch (error) {
    console.error('處理交易時發生錯誤：', error);
    res.status(500).send('處理交易時發生錯誤');
  }
});

module.exports = router;
