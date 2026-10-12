const canvas = document.getElementById('background');
const context = canvas.getContext('2d');

let width = 0;
let height = 0;

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

	// TODO
}

function update(deltaTime) {
	// TODO
}

function draw() {
	// Clear the entire rectangle
	context.clearRect(0, 0, width, height);

	// TODO
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


resizeCanvas();

window.addEventListener('resize', resizeCanvas);
