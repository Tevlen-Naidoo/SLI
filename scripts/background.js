import { unipolarSineWave, noise2D } from "./utilities.js";

const canvas = document.getElementById('background');
const context = canvas.getContext('2d');

let width = 0;
let height = 0;
let dpr = 1;

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
let transitionDuration = 0.5;

let phase = "typing";
let characterTimer = 0;
let pauseTimer = 0;

const wiggle = {
	frameCount: 4,         // number of distinct wobble patterns to cycle through
	boilRate: 6,           // pattern changes per second
	frequency: 0.15,       // noise cells per CSS pixel: higher = smaller, tighter wobbles
	amplitude: 0.6,        // max displacement in CSS pixels
	supersample: 3         // sub-samples per pixel along each axis: higher = smoother edges, slower
};

// Off-screen canvases: one holds the crisp text, the other receives the warped result
const sourceCanvas = document.createElement('canvas');
const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });

const wiggleCanvas = document.createElement('canvas');
const wiggleContext = wiggleCanvas.getContext('2d');

let wiggleCacheKey = "";
let wiggleBox = { width: 0, height: 0 };

function parseColor(color) {
	sourceCanvas.width = sourceCanvas.height = 1;
	sourceContext.fillStyle = color;
	sourceContext.fillRect(0, 0, 1, 1);

	const [r, g, b] = sourceContext.getImageData(0, 0, 1, 1).data;
	return { r, g, b };
}

function sampleAlpha(data, w, h, x, y) {
	if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return 0;

	const x0 = Math.floor(x);
	const y0 = Math.floor(y);
	const x1 = Math.min(x0 + 1, w - 1);
	const y1 = Math.min(y0 + 1, h - 1);

	const tx = x - x0;
	const ty = y - y0;

	const a = data[(y0 * w + x0) * 4 + 3];
	const b = data[(y0 * w + x1) * 4 + 3];
	const c = data[(y1 * w + x0) * 4 + 3];
	const d = data[(y1 * w + x1) * 4 + 3];

	const top = a + (b - a) * tx;
	const bottom = c + (d - c) * tx;

	return top + (bottom - top) * ty;
}

function renderWiggleText(message, seed) {
	const metrics = context.measureText(message);

	const padding = Math.ceil(wiggle.amplitude * 2);
	const halfWidth = Math.ceil(Math.max(metrics.actualBoundingBoxLeft, metrics.actualBoundingBoxRight, metrics.width / 2)) + padding;
	const halfHeight = Math.ceil(Math.max(metrics.fontBoundingBoxAscent, metrics.fontBoundingBoxDescent)) + padding;

	const cssWidth = halfWidth * 2;
	const cssHeight = halfHeight * 2;

	const w = Math.ceil(cssWidth * dpr);
	const h = Math.ceil(cssHeight * dpr);

	const ss = wiggle.supersample;
	const sw = w * ss;
	const sh = h * ss;

	const color = parseColor(textStyle.fillStyle);

	sourceCanvas.width = sw;
	sourceCanvas.height = sh;
	wiggleCanvas.width = w;
	wiggleCanvas.height = h;

	sourceContext.setTransform(dpr * ss, 0, 0, dpr * ss, 0, 0);
	sourceContext.font = textStyle.font;
	sourceContext.fillStyle = textStyle.fillStyle;
	sourceContext.textAlign = "center";
	sourceContext.textBaseline = "middle";
	sourceContext.fillText(message, halfWidth, halfHeight);

	const src = sourceContext.getImageData(0, 0, sw, sh).data;
	const output = wiggleContext.createImageData(w, h);
	const dst = output.data;

	const frequency = wiggle.frequency / dpr;
	const amplitude = wiggle.amplitude * dpr;
	const sampleCount = ss * ss;

	for (let y = 0; y < h; y++) {
		const ny = y * frequency;

		for (let x = 0; x < w; x++) {
			const nx = x * frequency;

			const dx = noise2D(nx, ny, seed) * amplitude;
			const dy = noise2D(nx, ny, seed + 101) * amplitude;

			const baseX = (x + dx) * ss;
			const baseY = (y + dy) * ss;

			const last = ss - 1;
			const c0 = sampleAlpha(src, sw, sh, baseX, baseY);
			const c1 = sampleAlpha(src, sw, sh, baseX + last, baseY);
			const c2 = sampleAlpha(src, sw, sh, baseX, baseY + last);
			const c3 = sampleAlpha(src, sw, sh, baseX + last, baseY + last);

			let alpha;
			if (c0 === c1 && c0 === c2 && c0 === c3 && (c0 === 0 || c0 === 255)) {
				alpha = c0;
			}
			else {
				let sum = 0;
				for (let j = 0; j < ss; j++) {
					for (let i = 0; i < ss; i++) {
						sum += sampleAlpha(src, sw, sh, baseX + i, baseY + j);
					}
				}
				alpha = sum / sampleCount;
			}

			if (alpha === 0) continue;

			const index = (y * w + x) * 4;
			dst[index] = color.r;
			dst[index + 1] = color.g;
			dst[index + 2] = color.b;
			dst[index + 3] = alpha;
		}
	}

	wiggleContext.putImageData(output, 0, 0);
	wiggleBox = { width: cssWidth, height: cssHeight };
}

function drawWiggleText(message, x, y) {
	if (!message) return;

	const seed = Math.floor(elapsedTime * wiggle.boilRate) % wiggle.frameCount;
	const key = `${message}|${seed}|${dpr}|${textStyle.font}`;

	if (key !== wiggleCacheKey) {
		wiggleCacheKey = key;
		renderWiggleText(message, seed);
	}

	context.drawImage(wiggleCanvas, x - wiggleBox.width / 2, y - wiggleBox.height / 2, wiggleBox.width, wiggleBox.height);
}

function showMessage() {
	const message = script[currentMessageIndex];
	const visibleText = message.substring(0, characterShown);

	const totalWidth = context.measureText(visibleText).width;

	drawWiggleText(visibleText, width / 2, height / 2);

	caret(width / 2 + totalWidth / 2 + 10, height / 2);
}


function resizeCanvas() {
	dpr = Math.min(window.devicePixelRatio || 1, 2);

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
				phase = "transition";
				pauseTimer = 0;
			}

			break;
		}

		case "transition": {
			pauseTimer += deltaTime;

			if (pauseTimer >= transitionDuration) {
				currentMessageIndex++;
				phase = "typing";
				characterTimer = 0;
				pauseTimer = 0;
			}
		}

		case "done": {
			break;
		}
	}


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
