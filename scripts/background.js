import { unipolarSineWave } from "./utilities.js";

const canvas = document.getElementById('background');
const context = canvas.getContext('2d');

let width = 0;
let height = 0;

let elapsedTime = 0;

const textStyle = {
	font: "50pt 'Yuyu'",
	fillStyle: "#000000",
	textAlign: "center",
	textBaseline: "middle"
};

document.fonts.ready.then(() => {
	textStyle.font = "50pt 'Yuyu'";
})

const script = [
	"Hello, World",
	// "I hope you're doing well"
];

let currentMessageIndex = 0;
let characterShown = 0;
let typingSpeed = 10;
let typingTimer = 0;

function showMessage() {
	const messsage = script[currentMessageIndex];
	const visibleText = messsage.substring(0, characterShown);

	context.fillText(visibleText, width / 2, height / 2);
	// caret();
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
}

function update(deltaTime) {
	elapsedTime += deltaTime;

	typingTimer += deltaTime * typingSpeed;

	while (typingTimer >= 1) {
		characterShown++;
		typingTimer--;
	}

	const message = script[currentMessageIndex];

	if (characterShown >= message.length) {
		characterShown = message.length;
	}
}

function caret() {
	context.save();

	context.fillStyle = `rgba(0, 0, 0, ${unipolarSineWave(4 * elapsedTime)})`;
	context.fillRect(width / 2, height / 2, 10, 20);

	context.restore();
}

function draw() {
	// Clear the entire rectangle
	context.clearRect(0, 0, width, height);

	context.font = textStyle.font;
	context.fillStyle = textStyle.fillStyle;
	context.textAlign = textStyle.textAlign;
	context.textBaseline = textStyle.textBaseline;

	showMessage();

}

// Main animation loop
let lastTime = 0;

function animate(timestamp) {
	// Delta time in seconds; clamp large jumps after tab inactivity
	const deltaTime = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0;

	lastTime = timestamp;

	update(deltaTime);
	draw();

	requestAnimationFrame(animate);
}


window.addEventListener('resize', resizeCanvas);

init();
requestAnimationFrame(animate);
