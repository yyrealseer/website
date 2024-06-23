let navigationbtn = document.getElementById('navigation-icon-closed');
let navigationlist = document.getElementById('mobile-navigation-container-closed');

let navigationflag = false
navigationbtn.onclick = function () {
    navigationflag = !navigationflag;
    if (navigationflag) {
        navigationlist.id = 'mobile-navigation-container';
        navigationbtn.id = 'navigation-icon';
    }
    else {
        navigationlist.id = 'mobile-navigation-container-closed';
        navigationbtn.id = 'navigation-icon-closed';
    }
};

addEventListener('scroll', function () {
    navigationlist.id = 'mobile-navigation-container-closed';
    navigationbtn.id = 'navigation-icon-closed';
    navigationflag = false;
});