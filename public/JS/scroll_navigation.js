

const goabout = document.getElementById("Go-about");
const goserverce = document.getElementById("Go-serverce");
const gotrack = document.getElementById("Go-track");

const goabout3 = document.getElementById("Go-about3");
const goserverce3 = document.getElementById("Go-serverce3");
const gotrack3 = document.getElementById("Go-track3");

/*--------------------Header 1--------------------*/

backtop.addEventListener("click", function () {
	window.scrollTo(0, 0);
});
goabout.addEventListener("click", function () {
	const section = document.getElementById(`about`);
	window.scrollTo({
		top: section.offsetTop,
	});
});
goserverce.addEventListener("click", function () {
	const section = document.getElementById(`serverce`);
	window.scrollTo({
		top: section.offsetTop,
	});
});
gotrack.addEventListener("click", function () {
	const section = document.getElementById(`track-compilation`);
	window.scrollTo({
		top: section.offsetTop,
	});
});

/*--------------------Header 3--------------------*/

goabout3.addEventListener("click", function () {
	const section = document.getElementById(`about`);
	window.scrollTo({
		top: section.offsetTop,
	});
});
goserverce3.addEventListener("click", function () {
	const section = document.getElementById(`serverce`);
	window.scrollTo({
		top: section.offsetTop,
	});
});
gotrack3.addEventListener("click", function () {
	const section = document.getElementById(`track-compilation`);
	window.scrollTo({
		top: section.offsetTop,
	});
});
