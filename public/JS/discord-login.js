// 檢查使用者是否已經登入
function checkDiscordLogin() {
    // 嘗試從 sessionStorage 中讀取 userToken
    const userToken = sessionStorage.getItem('userToken');
    
    if (userToken) {
        return true;  // 使用者已經登入
    } else {
        return false;  // 使用者未登入
    }
}

// 發送請求到伺服器，檢查 Discord 登入狀態
function checkLoginAndSubmit() {
    fetch('/check-discord-login')  // 發送請求給伺服器檢查登入狀態
        .then(response => response.json())
        .then(data => {
            if (data.isLoggedIn) {
                document.getElementById('popupForm').submit();  // 用戶已登入，提交表單
            } else {
                alert('請先登入您的 Discord 帳戶!');
                window.location.href = '/login';  // 未登入，跳轉到登入頁面
            }
        })
        .catch(error => {
            console.error('檢查登入狀態時出錯:', error);
        });
}

// 設置 userToken，這個可以在用戶登入成功後被呼叫
function setUserToken(token) {
    sessionStorage.setItem('userToken', token);
}

// 清除登入資訊，當用戶登出時呼叫
function clearUserToken() {
    sessionStorage.removeItem('userToken');
}

// 處理 callback 並儲存 userToken 到 sessionStorage
function handleCallback(code) {
    fetch(`/callback?code=${code}`)
        .then(response => response.json())
        .then(data => {
            if (data.userToken) {
                // 儲存 userToken 到 sessionStorage
                sessionStorage.setItem('userToken', data.userToken);
                console.log("Token 已儲存:", data.userToken);
            }
        })
        .catch(error => {
            console.error('錯誤:', error);
        });
}
