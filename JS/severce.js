let mbtn = document.getElementById('mixing');
let abtn = document.getElementById('arrange');
let cbtn = document.getElementById('course');

let mcontent = document.getElementById('mixing-content')
let acontent = document.getElementById('arrange-content')
let ccontent = document.getElementById('course-content')

let serverce = true

mbtn.onclick = function(){
	if(serverce){
		serverce = !serverce
		mcontent.className = ('serverce-content');
	}
	else{
		serverce = !serverce
		mcontent.className = ('serverce-content-closed');
		acontent.className = ('serverce-content-closed');
		ccontent.className = ('serverce-content-closed');
	}
};

abtn.onclick = function(){
	if(serverce){
		serverce = !serverce
		acontent.className = ('serverce-content');
	}
	else{
		serverce = !serverce
		mcontent.className = ('serverce-content-closed');
		acontent.className = ('serverce-content-closed');
		ccontent.className = ('serverce-content-closed');
	}
};

cbtn.onclick = function(){
	if(serverce){
		serverce = !serverce
		ccontent.className = ('serverce-content');
	}
	else{
		serverce = !serverce
		mcontent.className = ('serverce-content-closed');
		acontent.className = ('serverce-content-closed');
		ccontent.className = ('serverce-content-closed');
	}
};
