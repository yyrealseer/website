const axios = require('axios');
const qs = require('qs');
const dotenv = require('dotenv');

dotenv.config();

// Discord OAuth2 參數設定
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/callback'; // 確保此處的 URI 與 Discord 開發者平台設置一致
const SCOPE = 'identify';

// 生成 Discord 登入連結的函式
function getDiscordAuthUrl(originalUrl) {
    return `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${SCOPE}&state=${encodeURIComponent(originalUrl)}`;
}

// 使用授權碼交換 Token 的函式
async function exchangeCodeForToken(code) {
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', qs.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return tokenResponse.data.access_token;
}

// 獲取用戶資訊的函式
async function getUserData(accessToken) {
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    return userResponse.data;
}

// 匯出函式以供其他檔案使用
module.exports = {
    getDiscordAuthUrl,
    exchangeCodeForToken,
    getUserData
};
