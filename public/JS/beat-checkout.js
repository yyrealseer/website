// 顯示彈出表單
function showPopup(description, amount,) {
    // 動態設置表單的值
    document.getElementById('description').value = description;
    document.getElementById('amount').value = amount;
    document.getElementById('invoiceId').value = generateMerchantOrderNo();
    document.getElementById('popupForm').style.display = 'flex';
    
    // 顯示表單和背景遮罩
    if (window.innerWidth <= 767) { // 偵測螢幕寬度
        document.getElementById('popupForm').style.flexDirection = 'column'; // 手機板樣式
    } else {
        document.getElementById('popupForm').style.flexDirection = 'row'; // 桌面版樣式
    }
    document.getElementById('overlay').style.display = 'block';
}

// 隱藏彈出表單
function hidePopup() {
    document.getElementById('popupForm').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// 生成 MerchantOrderNo
function generateMerchantOrderNo() {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yy}${mm}${dd}${hh}${mi}${ss}`;
}

// 檢查用戶是否登入
const isLoggedIn = !!localStorage.getItem('userData');

// 監聽表單提交事件
document.getElementById('popupForm').addEventListener('submit', function(event) {
    event.preventDefault(); // 阻止默認的表單提交
    checkLoginAndSubmit(); // 檢查登入狀態並提交表單
});

// 檢查 Discord 登入並提交表單
function checkLoginAndSubmit() {
    if (isLoggedIn) {  // 判斷是否已登入
        // 使用者已登入，提交表單
        document.getElementById('checkout-form').submit();
    } else {
        // 未登入，顯示提示訊息或跳轉到登入頁面
        alert('請先登入您的 Discord 帳戶!');
        window.location.href = '/login';  // 重定向到登入頁面
    }
}
