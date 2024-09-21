let mbtn = document.getElementById('mixing');
let abtn = document.getElementById('arrange');
let cbtn = document.getElementById('course');
let pbtn = document.getElementById('production');

let mcontent = document.getElementById('mixing-content');
let acontent = document.getElementById('arrange-content');
let ccontent = document.getElementById('course-content');
let pcontent = document.getElementById('production-content');

let serverce = true;

function closeAllContents() {
    mcontent.className = 'serverce-content-closed';
    acontent.className = 'serverce-content-closed';
    ccontent.className = 'serverce-content-closed';
    pcontent.className = 'serverce-content-closed';
}

function openContent(event, content) {
    event.stopPropagation();
    closeAllContents();
    serverce = false;
    setTimeout(() => {
        content.className = 'serverce-content';
    }, 75);
}

mbtn.onclick = function(event) {
    openContent(event, mcontent);
};

abtn.onclick = function(event) {
    openContent(event, acontent);
};

cbtn.onclick = function(event) {
    openContent(event, ccontent);
};

pbtn.onclick = function(event) {
    openContent(event, pcontent);
};

window.addEventListener('click',()=>{
	closeAllContents();
	serverce=true;
})