// main.js

// 動態加載 JavaScript 文件的函數
function loadScript(src, callback) {
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.onload = callback;
    document.head.appendChild(script);
}

// 加載其他 JavaScript 文件
loadScript('/JS/header.js', function() {
    console.log('header.js 已加載');
    // 這裡可以初始化 header.js 中的功能
});

loadScript('/JS/mobile-header.js', function() {
    console.log('mobile-header.js 已加載');
    // 初始化 mobile-header.js 的功能
});

loadScript('/JS/mobile-navigation.js', function() {
    console.log('mobile-navigation.js 已加載');
    // 初始化 mobile-navigation.js 的功能
});

loadScript('/JS/severce.js', function() {
    console.log('severce.js 已加載');
    // 初始化 severce.js 的功能
});

loadScript('/JS/trackcompilation.js', function() {
    console.log('trackcompilation.js 已加載');
    // 初始化 trackcompilation.js 的功能
});

loadScript('/JS/navigation.js', function() {
    console.log('navigation.js 已加載');
    // 初始化 navigation.js 的功能
});