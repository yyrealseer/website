let btn = document.getElementById('header-icon');
let list = document.getElementById('mobile-list-closed');

let flag = false
btn.onclick = function () {
    flag = !flag;
    if (flag) {
        list.id = 'mobile-list';
    }
    else {
        list.id = 'mobile-list-closed';
    }
};

addEventListener('scroll', function () {
    list.id = 'mobile-list-closed';
    flag = false;
});