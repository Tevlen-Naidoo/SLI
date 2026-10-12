const canvas = document.getElementById('background');
const context = canvas.getContext('2d');

let width = 0;
let height = 0;

const script = [
	"Hello, World",
	// "I hope you're doing well"
];

function showMessage() {
	context.fillStyle = "black"

	script.forEach((message) => {
		let metrics = context.measureText(message);
		let messageHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;

		context.fillText(message, (width - metrics.width) / 2, (height - messageHeight) / 2);
	})
}

function resizeCanvas() {
	const dpr = Math.min(window.devicePixelRatio || 1, 2);

	width = window.innerWidth;
	height = window.innerHeight;

	canvas.width = Math.round(width * dpr);
	canvas.height = Math.round(height * dpr);

	context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function init() {
	resizeCanvas();

	// Setting up the font
	document.fonts.ready.then(() => {
		context.font = "50pt 'Yuyu', sans-seriff";
	})
}

function update(deltaTime) {
	// TODO
}

function draw() {
	// Clear the entire rectangle
	context.clearRect(0, 0, width, height);

	// TODO

	// context.fillText("Hello World", 50, 100);
	showMessage();
}

// Main animation loop
let lastTime = 0;

function animate(timestamp) {
	// Delta time in seconds; clamp large jumps after tab inactivity
	const deltaTime = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;

	lastTime = deltaTime;

	update(deltaTime);
	draw();

	requestAnimationFrame(animate);
}


window.addEventListener('resize', resizeCanvas);

init();
requestAnimationFrame(animate);
