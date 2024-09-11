let mobilelist = document.getElementById('mobile-pages-closed');
let listbtn = document.getElementById('header-icon');
let list = true;

listbtn.onclick = function () {
    if (list) {
        list = !list;
        mobilelist.id = 'mobile-pages';
    }
    else {
        list = !list;
        mobilelist.id = 'mobile-pages-closed';
    };
};

addEventListener('scroll', function () {
    mobilelist.id = 'mobile-pages-closed';
    list = true;
});