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
	"I hope you're doing well"
];

function caret(x, y) {
	context.save();

	const caretHeight = 62.5;
	const caretWidth = 3;

	context.fillStyle = `rgba(0, 0, 0, ${unipolarSineWave(4 * elapsedTime)})`;
	context.fillRect(x, y - caretHeight / 2, caretWidth, caretHeight);

	context.restore();
}

let currentMessageIndex = 0;
let characterShown = 0;

let typingSpeed = 10;
let backspaceSpeed = 10;
let displayDuration = 2;

let phase = "typing";
let characterTimer = 0;
let pauseTimer = 0;

let typingTimer = 0;
let displayPause = 0;
let fullyDisplayed = false;

function showMessage() {
	const message = script[currentMessageIndex];
	const visibleText = message.substring(0, characterShown);

	context.fillText(visibleText, width / 2, height / 2);

	const metrics = context.measureText(visibleText);
	const textEndX = width / 2 + metrics.width / 2;

	caret(textEndX + 10, height / 2);
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
}

function update(deltaTime) {
	elapsedTime += deltaTime;

	// typingTimer += deltaTime * typingSpeed;
	//
	// while (typingTimer >= 1) {
	// 	characterShown++;
	// 	typingTimer--;
	// }

	const message = script[currentMessageIndex];

	switch (phase) {
		case "typing": {
			characterTimer += deltaTime * typingSpeed;

			while (characterTimer >= 1) {
				characterShown++;
				characterTimer--;

			}

			if (characterShown >= message.length) {
				characterShown = message.length;
				phase = "pause";
				pauseTimer = 0;
				characterTimer = 0;
			}

			break;

		}

		case "pause": {
			pauseTimer += deltaTime;

			if (pauseTimer >= displayDuration) {
				if (currentMessageIndex == script.length - 1) {
					phase = "done";

				}
				else {
					phase = "deleting";
					characterTimer = 0;
				}
			}

			break;
		}

		case "deleting": {
			characterTimer += deltaTime * backspaceSpeed;

			while (characterTimer >= 1) {
				characterShown--;
				characterTimer--;
			}

			if (characterShown <= 0) {
				characterShown = 0;
				currentMessageIndex++;
				phase = "typing";
				characterTimer = 0;
			}

			break;
		}

		case "done": {
			break;
		}
	}

	// // Message is growing
	// if (characterShown >= message.length) {
	// 	characterShown = message.length;
	// 	fullyDisplayed = true;
	// }
	//
	// if (fullyDisplayed && displayPause <= 10) {
	// 	displayPause++;
	// }
	//
	// if (displayPause >= 10) {
	// 	characterShown--;
	// 	fullyDisplayed = false;
	//
	// }
	//

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
