  // 設置滾動進度的標記，避免重複觸發
  let scroll25 = false;
  let scroll50 = false;
  let scroll75 = false;
  let scroll100 = false;

  // 監聽滾動事件
  window.addEventListener('scroll', () => {
    // 獲取當前滾動位置
    const scrollPosition = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    // 計算滾動百分比
    const scrollPercent = (scrollPosition / pageHeight) * 100;

    // 根據滾動百分比觸發對應事件，並避免重複觸發
    if (!scroll25 && scrollPercent >= 25) {
      gtag('event', '首頁滾動', {
        'event_category': 'engagement',
        'event_label': '首頁滾動 25%',
        'value': 25
      });
      scroll25 = true;
    }

    if (!scroll50 && scrollPercent >= 50) {
      gtag('event', '首頁滾動', {
        'event_category': 'engagement',
        'event_label': '首頁滾動 50%',
        'value': 50
      });
      scroll50 = true;
    }

    if (!scroll75 && scrollPercent >= 75) {
      gtag('event', '首頁滾動', {
        'event_category': 'engagement',
        'event_label': '首頁滾動 75%',
        'value': 75
      });
      scroll75 = true;
    }

    if (!scroll100 && scrollPercent >= 100) {
      gtag('event', '首頁滾動', {
        'event_category': 'engagement',
        'event_label': '首頁滾動 100%',
        'value': 100
      });
      scroll100 = true;
    }
  });