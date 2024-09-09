// 顯示彈出表單
function showPopup(itemDesc, amount) {
    // 動態設置表單的值
    document.getElementById('ItemDesc').value = itemDesc;
    document.getElementById('amount').value = parseFloat(amount).toFixed(2);
    document.getElementById('invoiceId').value = generateMerchantOrderNo();
    document.getElementById('popupForm').style.display = 'flex';
    
    // 顯示表單和背景遮罩
    if (window.innerWidth <= 767) { // 偵測螢幕寬度
        document.getElementById('popupForm').style.flexDirection = 'column'; // 手機板樣式
    } else {
        document.getElementById('popupForm').style.flexDirection = 'row'; // 桌面版樣式
    };
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