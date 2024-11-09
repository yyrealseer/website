// 檢查使用者是否已經登入
function checkDiscordLogin() {
    // 嘗試從 sessionStorage 中讀取 userToken
    const userToken = localStorage.getItem('userToken');
    
    if (userToken) {
        return true;  // 使用者已經登入
    } else {
        return false;  // 使用者未登入
    }
}

// 設置 userToken，這個可以在用戶登入成功後被呼叫
function setUserToken(token) {
    localStorage.setItem('userToken', data.userToken); 
}

// 清除登入資訊，當用戶登出時呼叫
function clearUserToken() {
    localStorage.removeItem('userToken');
}

// 處理回調，接收後端傳來的資料並儲存到 localStorage
document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // 發送請求到後端處理 /callback
        fetch(`/callback?code=${code}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 儲存用戶資料
                    localStorage.setItem('discordUser', JSON.stringify(data.userData));
                    console.log("用戶資料已儲存", data.userData);
                    
                    // 跳轉到指定頁面
                    setTimeout(() => {
                        if (data.redirectUrl) {
                            console.log("準備跳轉到：", data.redirectUrl);
                            window.location.href = data.redirectUrl;
                        }
                    }, 500);
                } else {
                    console.error("登入失敗", data.message);
                }
            })
            .catch(error => {
                console.error('錯誤:', error);
            });
    } else {
        console.error("未收到授權碼");
    }
});