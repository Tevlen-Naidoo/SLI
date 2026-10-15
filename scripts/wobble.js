/* ==========================================================================
   Wobble
   The hand-drawn "boil" from the original message script, as a full-screen
   post-process. Everything is drawn crisp onto an off-screen 2D canvas,
   then this pass draws it onto the visible canvas with every pixel nudged
   by 2D noise. The noise pattern cycles through a few seeds a few times a
   second, so lines shimmer like a hand-drawn animation.

   Runs on the GPU (WebGL2), so it costs almost nothing per frame.
   The noise is the same hash as noise2D in utilities.js.
   ========================================================================== */

const VERTEX = `#version 300 es
void main() {
	// One triangle that covers the whole screen
	vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
	gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D u_source;
uniform vec2 u_size;          // device pixels
uniform float u_frequency;    // noise cells per device pixel
uniform float u_amplitude;    // max displacement in device pixels
uniform int u_seed;
uniform int u_supersample;

out vec4 outColor;

float hash2D(int ix, int iy, int seed) {
	uint h = uint(ix) * 374761393u + uint(iy) * 668265263u + uint(seed) * 1274126177u;
	h = (h ^ (h >> 13u)) * 1103515245u;
	h ^= h >> 16u;
	return float(h & 0xffffu) / 32768.0 - 1.0;
}

float noise2D(vec2 p, int seed) {
	vec2 i = floor(p);
	vec2 f = p - i;
	vec2 s = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

	int ix = int(i.x), iy = int(i.y);
	float a = hash2D(ix, iy, seed);
	float b = hash2D(ix + 1, iy, seed);
	float c = hash2D(ix, iy + 1, seed);
	float d = hash2D(ix + 1, iy + 1, seed);

	return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

void main() {
	// Pixel position from the top-left, like the 2D canvas
	vec2 pixel = vec2(gl_FragCoord.x, u_size.y - gl_FragCoord.y) - 0.5;

	vec2 n = pixel * u_frequency;
	vec2 offset = vec2(noise2D(n, u_seed), noise2D(n, u_seed + 101)) * u_amplitude;
	vec2 base = pixel + offset;

	// Average a few samples inside the pixel for smooth edges
	vec4 sum = vec4(0.0);
	float ss = float(u_supersample);
	for (int j = 0; j < 4; j++) {
		if (j >= u_supersample) break;
		for (int i = 0; i < 4; i++) {
			if (i >= u_supersample) break;
			vec2 p = base + (vec2(i, j) + 0.5) / ss;
			sum += texture(u_source, p / u_size);
		}
	}
	outColor = sum / (ss * ss);
}`;

export class Wobble {
	/**
	 * Returns null if WebGL2 isn't available; the caller should then draw directly.
	 * @param {HTMLCanvasElement} view   the visible canvas
	 * @param {object} [opts]
	 * @param {number} [opts.frameCount=4]   number of distinct wobble patterns to cycle through
	 * @param {number} [opts.boilRate=6]     pattern changes per second
	 * @param {number} [opts.frequency=0.15] noise cells per CSS pixel: higher = smaller, tighter wobbles
	 * @param {number} [opts.amplitude=0.6]  max displacement in CSS pixels
	 * @param {number} [opts.supersample=2]  samples per pixel along each axis (1..4): higher = smoother edges
	 */
	static create(view, opts = {}) {
		const gl = view.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
		return gl ? new Wobble(gl, opts) : null;
	}

	constructor(gl, opts) {
		this.gl = gl;
		this.frameCount = opts.frameCount ?? 4;
		this.boilRate = opts.boilRate ?? 6;
		this.frequency = opts.frequency ?? 0.15;
		this.amplitude = opts.amplitude ?? 0.6;
		this.supersample = opts.supersample ?? 2;
		this.enabled = true;  // false = pass the image through untouched

		const program = gl.createProgram();
		for (const [type, source] of [[gl.VERTEX_SHADER, VERTEX], [gl.FRAGMENT_SHADER, FRAGMENT]]) {
			const shader = gl.createShader(type);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
			gl.attachShader(program, shader);
		}
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
		gl.useProgram(program);

		this.uniforms = {};
		for (const name of ['u_size', 'u_frequency', 'u_amplitude', 'u_seed', 'u_supersample']) {
			this.uniforms[name] = gl.getUniformLocation(program, name);
		}

		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		// The 2D canvas is uploaded as-is; output stays premultiplied for the page
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
	}

	resize(width, height) {
		this.gl.canvas.width = width;
		this.gl.canvas.height = height;
	}

	/**
	 * Draws `source` (a 2D canvas the same size as the view) with the wobble applied.
	 * @param {number} clock  seconds; drives which wobble pattern is showing
	 * @param {number} dpr    device pixels per CSS pixel
	 */
	render(source, clock, dpr) {
		const gl = this.gl;
		const u = this.uniforms;
		const { width, height } = gl.canvas;

		gl.viewport(0, 0, width, height);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);

		const seed = Math.floor(clock * this.boilRate) % this.frameCount;
		gl.uniform2f(u.u_size, width, height);
		gl.uniform1f(u.u_frequency, this.frequency / dpr);
		gl.uniform1f(u.u_amplitude, this.enabled ? this.amplitude * dpr : 0);
		gl.uniform1i(u.u_seed, seed);
		gl.uniform1i(u.u_supersample, Math.max(1, Math.min(4, Math.round(this.supersample))));

		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	}
}
