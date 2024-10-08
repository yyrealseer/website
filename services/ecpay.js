const express = require('express');
const axios = require('axios');
const router = express.Router();
const crypto = require('crypto');
const nodemailer = require('nodemailer'); // 引入 nodemailer
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: './.env.links' });

// 綠界提供的 SDK
const ecpay_payment = require('./ECPAY_Payment_node_js/index');

// 設置 nodemailer 的傳輸器
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 初始化
const options = {
  OperationMode: 'Production', // Test or Production
  MercProfile: {
    MerchantID: process.env.ECPAY_MERCHANT_ID,
    HashKey: process.env.ECPAY_HASH_KEY,
    HashIV: process.env.ECPAY_HASH_IV,
  },
  IgnorePayment: [],
  IsProjectContractor: false,
};

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
    TradeDesc: encodeURIComponent(req.body.description.trim()), // URL編碼
    ItemName: encodeURIComponent(req.body.description.trim()), // URL編碼
    CustomField1: encodeURIComponent(req.body.Email.trim()),
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
  delete data.CheckMacValue; // 刪除回傳的 CheckMacValue 以便重新計算

  try {
    const create = new ecpay_payment(options);
    const checkValue = create.payment_client.helper.gen_chk_mac_value(data); // 生成 CheckMacValue

    if (CheckMacValue === checkValue) {
      console.log('交易成功，驗證通過：', data);
      const Email = decodeURIComponent(data.CustomField1); // 解碼 Email
      const reference_id = data.CustomField2;
      const downloadLink = process.env[`${reference_id}_LINK`] || process.env.DEFAULT_LINK;

      // 確保 i18n 已初始化
      const emailTitle = req.__('success_email.title') || 'Success!';
      const emailContent = req.__('success_email.content') || 'Your payment was successful.';

      // 發送確認郵件
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: Email,
        subject: emailTitle,
        text: `${emailContent} ${downloadLink}`,
      };

      try {
        await transporter.sendMail(mailOptions);  // 使用 await 發送郵件
        console.log('確認郵件已發送');

        // 在這裡將事件發送到 GA4
        const measurementId = process.env.GA4_measurementId;  // 你的 GA4 測量ID
        const apiSecret = process.env.GA4_Secret;  // GA4 的 API 密鑰
        const clientId = crypto.randomUUID();  // 生成唯一 client_id，替代硬編碼
        const transactionId = data.MerchantTradeNo;
        const totalValue = parseFloat(data.TradeAmt);  // 訂單金額

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
                items: [
                  {
                    item_name: reference_id,
                    item_id: reference_id,
                    price: totalValue,
                    quantity: 1
                  }
                ]
              }
            }
          ]
        };

        await axios.post(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, ga4Payload);
        console.log('GA4 購買事件已發送');
        return res.send('1|OK'); // 確保只返回一次

      } catch (error) {
        console.error('發送郵件或 GA4 購買事件時發生錯誤：', error);
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

// 用戶交易完成後的轉址
router.get('/success', (req, res) => {
  console.log('clientReturn:', req.body, req.query);
  res.render('return', { query: req.query });
});

module.exports = router;
