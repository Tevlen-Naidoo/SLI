
export function unipolarSineWave(x) {
	return (Math.sin(x) + 1) / 2;
}

function randomNoise(canvas, x, y, width, height, alpha) {
	x = x || 0;
	y = y || 0;

	width = width || canvas.width;
	height = height || canvas.height;

	alpha = alpha || 255;

	let context = canvas.getContext("2d");
	let imageData = context.getImageData(x, y, width, height);

	let random = Math.random;
	let pixels = imageData.data;
	let n = pixels.length;

	let i = 0;

	while (i < n) {
		pixels[i++] = pixels[i++] = pixels[i++] = (random() * 255) | 0;
		pixels[i++] = alpha;
	}

	context.putImageData(imageData, x, y);

	return canvas;
}

export function perlinNoise(canvas, noise) {
	noise = noise || randomNoise(createCanvas(canvas.width, canvas.height));
	let context = canvas.getContext("2d");

	context.save();

	for (let size = 4; size <= noise.width; size *= 2) {
		let x = (Math.random() * (noise.width - size)) | 0;
		let y = (Math.random() * (noise.height - size)) | 0;

		context.globalAlpha = 4 / size;
		context.drawImage(noise, x, y, size, size, 0, 0, canvas.width, canvas.height);

	}

	context.restore();

	return canvas;
}

export function noise1D(x, seed = 0) {
	const hash = (n) => {
		const value = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
		return (value - Math.floor(value)) * 2 - 1;
	}

	const i = Math.floor(x);
	const t = x - i;

	const smooth = t * t * (3 - 2 * t);

	return hash(i) * (1 - smooth) + hash(i + 1) * smooth;
}

function hash2D(ix, iy, seed) {
	let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1274126177)) | 0;
	h = Math.imul(h ^ (h >>> 13), 1103515245);
	h ^= h >>> 16;

	return (h & 0xffff) / 0x8000 - 1;
}

export function noise2D(x, y, seed = 0) {
	const ix = Math.floor(x);
	const iy = Math.floor(y);

	const fx = x - ix;
	const fy = y - iy;

	const sx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
	const sy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);

	const a = hash2D(ix, iy, seed);
	const b = hash2D(ix + 1, iy, seed);
	const c = hash2D(ix, iy + 1, seed);
	const d = hash2D(ix + 1, iy + 1, seed);

	const top = a + (b - a) * sx;
	const bottom = c + (d - c) * sx;

	return top + (bottom - top) * sy;
}

export function degrees2radians(degrees) {
	return degrees * (Math.PI / 180);
}

export function radians2degrees(radians) {
	return radians * (180 / Math.PI);
}

export function cartesian2polar(x, y) {
	return { radius: Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)), angle: Math.atan(y / x) };
}

export function polar2cartesian(r, theta) {
	return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
}
