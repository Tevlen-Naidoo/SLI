/* ==========================================================================
   Line-drawing animation framework
   --------------------------------------------------------------------------
   Stage     - canvas, resizing, centred coordinates, design area, main loop,
               optional hand-drawn wobble over the whole frame (wobble.js)
   DrawPath  - geometry that can be drawn partially (0..1 of its length)
   Timeline  - schedules items: strokes, layers and clips
   Stroke    - a path being drawn, with timing and style
   Layer     - a group of items with animated position/rotation/scale/opacity
   Clip      - your own canvas drawing code, placed on the timeline
   Ease      - easing functions
   Helpers   - clamp01, lerp, progress, keyframes

   Coordinates: (0, 0) is the centre of the screen, y points down.
   The design area (default 1600 x 900 units, 16:9 landscape) is always
   fully visible: x from -800 to 800, y from -450 to 450.
   On screens that aren't exactly 16:9 a little extra shows beyond it;
   stage.halfW / stage.halfH give the visible edges. Anything that must
   reach the screen edges should use them.
   ========================================================================== */


import { Wobble } from './wobble.js';


/* ==========================================================================
   Easing and helpers
   ========================================================================== */

export const Ease = {
	linear: t => t,
	inSine: t => 1 - Math.cos((Math.PI * t) / 2),
	outSine: t => Math.sin((Math.PI * t) / 2),
	inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
	inCubic: t => t * t * t,
	outCubic: t => 1 - Math.pow(1 - t, 3),
	inOutCubic: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
	outBack: t => {
		const c1 = 1.70158, c3 = c1 + 1;
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
	},
};

export const clamp01 = v => Math.max(0, Math.min(1, v));

export const lerp = (a, b, t) => a + (b - a) * t;

// 0..1 progress of `time` through [start, start + duration], eased
export function progress(time, start, duration, ease = Ease.linear) {
	if (duration <= 0) return time >= start ? 1 : 0;
	return ease(clamp01((time - start) / duration));
}

/**
 * Returns a function of time that moves between keyframes.
 *   keyframes([[0, 0], [1, 100], [3, 50]], Ease.inOutSine)
 * gives 0 at t=0, 100 at t=1, 50 at t=3, holding the end values outside.
 */
export function keyframes(frames, ease = Ease.inOutSine) {
	return t => {
		if (t <= frames[0][0]) return frames[0][1];
		for (let i = 1; i < frames.length; i++) {
			const [t1, v1] = frames[i];
			if (t <= t1) {
				const [t0, v0] = frames[i - 1];
				return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
			}
		}
		return frames[frames.length - 1][1];
	};
}

// A plain value, or a function of local time
const valueAt = (v, t) => (typeof v === 'function' ? v(t) : v);

// Opacity from fadeIn / fadeOutAt / fadeOut, given local time
function fadeAlpha(local, fadeIn, fadeOutAt, fadeOut) {
	let a = fadeIn > 0 ? clamp01(local / fadeIn) : 1;
	if (fadeOutAt != null) {
		const out = fadeOut > 0
			? clamp01((local - fadeOutAt) / fadeOut)
			: (local >= fadeOutAt ? 1 : 0);
		a *= 1 - out;
	}
	return a;
}


/* ==========================================================================
   Stage
   ========================================================================== */

export class Stage {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {object} [opts]
	 * @param {number} [opts.designWidth=1600]  units across the design area
	 * @param {number} [opts.designHeight=900]  units down the design area
	 * @param {number} [opts.maxDpr=2]          cap on device pixel ratio
	 * @param {object|false} [opts.wobble]      wobble settings (see Wobble), or false to turn it off
	 *
	 * With wobble on, everything is drawn to an off-screen canvas (stage.canvas)
	 * and the wobbled result is shown on the canvas passed in (stage.view).
	 * Without WebGL2 it quietly falls back to drawing straight onto the view.
	 */
	constructor(canvas, opts = {}) {
		this.view = canvas;
		this.wobble = opts.wobble === false ? null : Wobble.create(canvas, opts.wobble);
		this.canvas = this.wobble ? document.createElement('canvas') : canvas;
		this.ctx = this.canvas.getContext('2d');

		this.designWidth = opts.designWidth ?? 1600;
		this.designHeight = opts.designHeight ?? 900;
		this.maxDpr = opts.maxDpr ?? 2;

		this.width = 0;     // CSS pixels
		this.height = 0;
		this.dpr = 1;
		this.scale = 1;     // CSS pixels per unit
		this.halfW = 0;     // visible extents in units
		this.halfH = 0;

		this.time = 0;      // seconds of animation time
		this.clock = 0;     // real seconds, keeps running while paused (drives the wobble)
		this.speed = 1;     // playback speed multiplier
		this.paused = false;
		this.onResize = null;

		this._lastTimestamp = 0;
		this._running = false;

		this.resize = this.resize.bind(this);
		window.addEventListener('resize', this.resize);
		this.resize();
	}

	resize() {
		this.dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
		this.width = window.innerWidth;
		this.height = window.innerHeight;

		this.canvas.width = Math.round(this.width * this.dpr);
		this.canvas.height = Math.round(this.height * this.dpr);
		if (this.wobble) this.wobble.resize(this.canvas.width, this.canvas.height);

		this.scale = Math.min(this.width / this.designWidth, this.height / this.designHeight);
		this.halfW = this.width / 2 / this.scale;
		this.halfH = this.height / 2 / this.scale;

		if (this.onResize) this.onResize(this);
	}

	// Clear the whole canvas, then set up centred, scaled coordinates
	beginFrame() {
		const ctx = this.ctx;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.globalAlpha = 1;
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		const s = this.dpr * this.scale;
		ctx.setTransform(s, 0, 0, s, this.canvas.width / 2, this.canvas.height / 2);
	}

	// Debug helper: outline the design area
	drawDesignArea(color = 'rgba(255, 0, 80, 0.6)') {
		const ctx = this.ctx;
		ctx.save();
		ctx.strokeStyle = color;
		ctx.lineWidth = 2 / this.scale;
		ctx.setLineDash([8 / this.scale, 6 / this.scale]);
		ctx.strokeRect(-this.designWidth / 2, -this.designHeight / 2, this.designWidth, this.designHeight);
		ctx.restore();
	}

	/**
	 * Debug helper: grid over the whole visible area, with the axes through
	 * (0, 0) highlighted and every major line labelled with its coordinate.
	 * Uses halfW / halfH, so it always fills the screen after a resize.
	 * Line widths and text are in screen pixels, so they stay crisp at any size.
	 * @param {object} [opts]
	 * @param {number} [opts.step=50]       units between grid lines
	 * @param {number} [opts.majorEvery=2]  every nth line is major (darker, labelled)
	 */
	drawGrid({ step = 50, majorEvery = 2, color = 'rgba(0, 120, 255, 0.15)',
		majorColor = 'rgba(0, 120, 255, 0.35)', axisColor = 'rgba(255, 0, 80, 0.7)' } = {}) {
		const ctx = this.ctx;
		const px = 1 / this.scale; // one CSS pixel in units
		const { halfW, halfH } = this;

		// Grid lines run from the first multiple of `step` off-screen, so they stay anchored to (0, 0)
		const x0 = Math.ceil(-halfW / step), x1 = Math.floor(halfW / step);
		const y0 = Math.ceil(-halfH / step), y1 = Math.floor(halfH / step);

		ctx.save();
		ctx.setLineDash([]);

		const line = (ax, ay, bx, by, style, width) => {
			ctx.beginPath();
			ctx.moveTo(ax, ay);
			ctx.lineTo(bx, by);
			ctx.strokeStyle = style;
			ctx.lineWidth = width * px;
			ctx.stroke();
		};

		for (let i = x0; i <= x1; i++) {
			if (i === 0) continue;
			line(i * step, -halfH, i * step, halfH, i % majorEvery ? color : majorColor, 1);
		}
		for (let j = y0; j <= y1; j++) {
			if (j === 0) continue;
			line(-halfW, j * step, halfW, j * step, j % majorEvery ? color : majorColor, 1);
		}

		// Axes on top
		line(-halfW, 0, halfW, 0, axisColor, 1.5);
		line(0, -halfH, 0, halfH, axisColor, 1.5);

		// Labels along the axes
		ctx.fillStyle = axisColor;
		ctx.font = `${11 * px}px monospace`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		for (let i = x0; i <= x1; i++) {
			if (i % majorEvery === 0) ctx.fillText(String(i * step), i * step + 3 * px, 3 * px);
		}
		for (let j = y0; j <= y1; j++) {
			if (j % majorEvery === 0 && j !== 0) ctx.fillText(String(j * step), 3 * px, j * step + 3 * px);
		}

		// Visible extents in the top-left corner
		ctx.fillText(`x ±${halfW.toFixed(0)}  y ±${halfH.toFixed(0)}`, -halfW + 6 * px, -halfH + 6 * px);

		ctx.restore();
	}

	restart() { this.time = 0; }
	seek(seconds) { this.time = Math.max(0, seconds); }
	pause() { this.paused = true; }
	resume() { this.paused = false; }
	togglePause() { this.paused = !this.paused; }

	/**
	 * Starts the main loop.
	 * update(dt, time) runs first, then draw(ctx, time) with the
	 * centred transform already applied.
	 */
	start({ update, draw } = {}) {
		if (this._running) return;
		this._running = true;

		const frame = timestamp => {
			// Delta time in seconds; clamp large jumps after tab inactivity
			const raw = this._lastTimestamp
				? Math.min((timestamp - this._lastTimestamp) / 1000, 0.05)
				: 0;
			this._lastTimestamp = timestamp;
			this.clock += raw;

			const dt = this.paused ? 0 : raw * this.speed;
			this.time += dt;

			if (update) update(dt, this.time);

			this.beginFrame();
			if (draw) draw(this.ctx, this.time);
			if (this.wobble) this.wobble.render(this.canvas, this.clock, this.dpr);

			requestAnimationFrame(frame);
		};

		requestAnimationFrame(frame);
	}
}


/* ==========================================================================
   DrawPath
   A path built from lines/curves that are sampled into points. Each point
   stores its distance along the path, so any fraction of it can be drawn.
   ========================================================================== */

export class DrawPath {
	constructor() {
		this.points = []; // { x, y, d, move }
		this.length = 0;
		this._x = 0;
		this._y = 0;
		this._startX = 0;
		this._startY = 0;
	}

	_push(x, y, move = false) {
		if (!move && this.points.length) {
			this.length += Math.hypot(x - this._x, y - this._y);
		}
		this.points.push({ x, y, d: this.length, move });
		this._x = x;
		this._y = y;
	}

	moveTo(x, y) {
		this._push(x, y, true);
		this._startX = x;
		this._startY = y;
		return this;
	}

	lineTo(x, y) {
		if (!this.points.length) return this.moveTo(x, y);
		this._push(x, y);
		return this;
	}

	quadTo(cx, cy, x, y, steps = 24) {
		const x0 = this._x, y0 = this._y;
		for (let i = 1; i <= steps; i++) {
			const t = i / steps, u = 1 - t;
			this._push(
				u * u * x0 + 2 * u * t * cx + t * t * x,
				u * u * y0 + 2 * u * t * cy + t * t * y
			);
		}
		return this;
	}

	cubicTo(c1x, c1y, c2x, c2y, x, y, steps = 32) {
		const x0 = this._x, y0 = this._y;
		for (let i = 1; i <= steps; i++) {
			const t = i / steps, u = 1 - t;
			const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
			this._push(
				a * x0 + b * c1x + c * c2x + d * x,
				a * y0 + b * c1y + c * c2y + d * y
			);
		}
		return this;
	}

	// Arc from angle a0 to a1 (radians). Connects from the current point if there is one.
	arc(cx, cy, r, a0, a1, steps = 48) {
		return this.ellipseArc(cx, cy, r, r, 0, a0, a1, steps);
	}

	// Full circle, drawn clockwise starting from `startAngle` (default: top)
	circle(cx, cy, r, startAngle = -Math.PI / 2, steps = 64) {
		return this.arc(cx, cy, r, startAngle, startAngle + Math.PI * 2, steps);
	}

	/**
	 * Elliptical arc from angle a0 to a1 (radians), with radii rx / ry and the
	 * whole ellipse turned by `rotation` (radians) about its centre.
	 * Same argument order as ctx.ellipse. Connects from the current point if there is one.
	 */
	ellipseArc(cx, cy, rx, ry, rotation, a0, a1, steps = 48) {
		const cos = Math.cos(rotation), sin = Math.sin(rotation);
		const at = a => {
			const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
			return [cx + ex * cos - ey * sin, cy + ex * sin + ey * cos];
		};

		const [sx, sy] = at(a0);
		if (this.points.length) this.lineTo(sx, sy);
		else this.moveTo(sx, sy);

		for (let i = 1; i <= steps; i++) {
			const [x, y] = at(a0 + (a1 - a0) * (i / steps));
			this._push(x, y);
		}
		return this;
	}

	// Full ellipse, drawn clockwise starting from `startAngle` (default: top)
	ellipse(cx, cy, rx, ry, rotation = 0, startAngle = -Math.PI / 2, steps = 64) {
		return this.ellipseArc(cx, cy, rx, ry, rotation, startAngle, startAngle + Math.PI * 2, steps);
	}

	// Rectangle from its top-left corner, drawn clockwise
	rect(x, y, w, h) {
		return this.moveTo(x, y).lineTo(x + w, y).lineTo(x + w, y + h).lineTo(x, y + h).close();
	}

	// Closed shape through a list of [x, y] points
	polygon(pts) {
		if (!pts.length) return this;
		this.moveTo(pts[0][0], pts[0][1]);
		for (let i = 1; i < pts.length; i++) this.lineTo(pts[i][0], pts[i][1]);
		return this.close();
	}

	// Smooth curve through a list of [x, y] points (Catmull-Rom). Great for hills.
	smooth(pts, steps = 20) {
		if (pts.length < 2) return this;
		if (this.points.length) this.lineTo(pts[0][0], pts[0][1]);
		else this.moveTo(pts[0][0], pts[0][1]);

		for (let i = 0; i < pts.length - 1; i++) {
			const p0 = pts[i - 1] || pts[i];
			const p1 = pts[i];
			const p2 = pts[i + 1];
			const p3 = pts[i + 2] || p2;
			this.cubicTo(
				p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
				p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
				p2[0], p2[1],
				steps
			);
		}
		return this;
	}

	close() {
		return this.lineTo(this._startX, this._startY);
	}

	// Position `t` (0..1) of the way along the path, by length
	pointAt(t) {
		const pts = this.points;
		if (!pts.length) return { x: 0, y: 0 };

		const target = this.length * clamp01(t);
		for (let i = 1; i < pts.length; i++) {
			const p = pts[i];
			if (p.d >= target && !p.move) {
				const prev = pts[i - 1];
				const k = p.d > prev.d ? (target - prev.d) / (p.d - prev.d) : 0;
				return { x: prev.x + (p.x - prev.x) * k, y: prev.y + (p.y - prev.y) * k };
			}
		}
		const last = pts[pts.length - 1];
		return { x: last.x, y: last.y };
	}

	// Builds the first `t` (0..1) of the path on ctx. Returns the pen tip position.
	trace(ctx, t) {
		const pts = this.points;
		ctx.beginPath();
		if (pts.length < 2 || t <= 0) return null;

		const target = this.length * Math.min(t, 1);
		let tip = pts[0];

		for (let i = 0; i < pts.length; i++) {
			const p = pts[i];

			if (p.d > target) {
				const prev = pts[i - 1];
				const k = (target - prev.d) / (p.d - prev.d);
				tip = { x: prev.x + (p.x - prev.x) * k, y: prev.y + (p.y - prev.y) * k };
				ctx.lineTo(tip.x, tip.y);
				return tip;
			}

			if (p.move) ctx.moveTo(p.x, p.y);
			else ctx.lineTo(p.x, p.y);
			tip = p;
		}
		return tip;
	}
}


/* ==========================================================================
   Stroke
   A path being drawn: when it starts, how long it takes, how it looks.
   ========================================================================== */

export class Stroke {
	constructor(path, opts = {}) {
		this.path = path;
		this.start = 0;                         // set by the timeline
		this.duration = opts.duration ?? 1;
		this.ease = opts.ease || Ease.inOutSine;

		this.color = opts.color || '#222';
		this.lineWidth = opts.lineWidth || 2;   // in units
		this.dash = opts.dash || null;          // e.g. [10, 6]

		this.stroke = opts.stroke ?? true;      // false = fill only, no outline
		this.fill = opts.fill || null;          // fades in once the outline is complete (or straight away if stroke is false)
		this.fillDuration = opts.fillDuration ?? 0.6;

		this.pen = opts.pen ?? true;            // small dot at the drawing tip

		this.fadeOutAt = opts.fadeOutAt ?? null; // seconds after start
		this.fadeOut = opts.fadeOut ?? 0;
	}

	get end() {
		return this.start + this.duration;
	}

	draw(ctx, time) {
		if (time < this.start) return;
		const local = time - this.start;

		const alpha = fadeAlpha(local, 0, this.fadeOutAt, this.fadeOut);
		if (alpha <= 0) return;

		const p = this.ease(clamp01(local / this.duration));

		ctx.save();
		ctx.globalAlpha *= alpha;

		const fillStart = this.stroke ? this.duration : 0;
		if (this.fill && local > fillStart) {
			ctx.save();
			ctx.globalAlpha *= clamp01((local - fillStart) / this.fillDuration);
			this.path.trace(ctx, 1);
			ctx.fillStyle = this.fill;
			ctx.fill();
			ctx.restore();
		}

		if (!this.stroke) {
			ctx.restore();
			return;
		}

		const tip = this.path.trace(ctx, p);
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.lineWidth;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		if (this.dash) ctx.setLineDash(this.dash);
		ctx.stroke();

		if (this.pen && tip && p < 1) {
			ctx.setLineDash([]);
			ctx.beginPath();
			ctx.arc(tip.x, tip.y, this.lineWidth * 1.5, 0, Math.PI * 2);
			ctx.fillStyle = this.color;
			ctx.fill();
		}

		ctx.restore();
	}
}


/* ==========================================================================
   Layer
   A group with its own timeline. Its children's times are relative to the
   layer's start. x, y, rotation, scale and opacity can be numbers or
   functions of the layer's local time in seconds.
   ========================================================================== */

export class Layer {
	constructor(opts = {}) {
		this.start = 0;              // set by the timeline
		this.duration = 0;           // set by the timeline
		this.timeline = new Timeline();

		this.x = opts.x ?? 0;
		this.y = opts.y ?? 0;
		this.rotation = opts.rotation ?? 0;  // radians
		this.scale = opts.scale ?? 1;
		this.opacity = opts.opacity ?? 1;

		this.fadeIn = opts.fadeIn ?? 0;
		this.fadeOutAt = opts.fadeOutAt ?? null;
		this.fadeOut = opts.fadeOut ?? 0;
	}

	get end() {
		return this.start + this.duration;
	}

	draw(ctx, time) {
		if (time < this.start) return;
		const t = time - this.start;

		const alpha = fadeAlpha(t, this.fadeIn, this.fadeOutAt, this.fadeOut) * valueAt(this.opacity, t);
		if (alpha <= 0) return;

		const s = valueAt(this.scale, t);

		ctx.save();
		ctx.globalAlpha *= alpha;
		ctx.translate(valueAt(this.x, t), valueAt(this.y, t));
		ctx.rotate(valueAt(this.rotation, t));
		ctx.scale(s, s);
		this.timeline.draw(ctx, t);
		ctx.restore();
	}
}


/* ==========================================================================
   Clip
   Your own drawing function, placed on the timeline:
     drawFn(ctx, t, clip)  where t = seconds since the clip started
   clip.progress(ease) gives 0..1 through the clip's duration.
   ========================================================================== */

export class Clip {
	constructor(drawFn, opts = {}) {
		this.drawFn = drawFn;
		this.start = 0;              // set by the timeline
		this.duration = 0;           // set by the timeline
		this.fadeIn = opts.fadeIn ?? 0;
		this.fadeOutAt = opts.fadeOutAt ?? null;
		this.fadeOut = opts.fadeOut ?? 0;
		this._t = 0;
	}

	get end() {
		return this.start + this.duration;
	}

	progress(ease = Ease.linear) {
		return progress(this._t, 0, this.duration, ease);
	}

	draw(ctx, time) {
		if (time < this.start) return;
		const t = time - this.start;

		const alpha = fadeAlpha(t, this.fadeIn, this.fadeOutAt, this.fadeOut);
		if (alpha <= 0) return;

		this._t = t;
		ctx.save();
		ctx.globalAlpha *= alpha;
		this.drawFn(ctx, t, this);
		ctx.restore();
	}
}


/* ==========================================================================
   Timeline
   Schedules items. By default each item starts when the previous ends.
   Scheduling options (shared by add, layer, clip):
     at: number   -> absolute start time (seconds)
     at: 'with'   -> start together with the previous item
     at: 'name'   -> start at a label set with tl.label('name')
     delay        -> extra offset added to the start (may be negative)
   Items are drawn in the order added, so later items sit on top.
   ========================================================================== */

export class Timeline {
	constructor() {
		this.items = [];
		this.labels = {};
		this.cursor = 0;
		this.lastStart = 0;
	}

	_startFor(opts) {
		let start;
		if (typeof opts.at === 'number') start = opts.at;
		else if (opts.at === 'with') start = this.lastStart;
		else if (typeof opts.at === 'string') {
			if (!(opts.at in this.labels)) throw new Error(`Unknown timeline label "${opts.at}"`);
			start = this.labels[opts.at];
		} else start = this.cursor;
		return Math.max(0, start + (opts.delay ?? 0));
	}

	// Places any item with { start, duration, draw(ctx, time) }
	place(item, opts = {}) {
		item.start = this._startFor(opts);
		this.items.push(item);
		this.lastStart = item.start;
		this.cursor = Math.max(this.cursor, item.start + item.duration);
		return item;
	}

	/**
	 * Draws a path. duration in seconds; if omitted, it comes from
	 * `speed` (units per second, default 500). With stroke: false
	 * (fill only) it defaults to fillDuration instead.
	 */
	add(path, opts = {}) {
		const duration = opts.duration ?? (opts.stroke === false
			? opts.fillDuration ?? 0.6
			: Math.max(0.3, path.length / (opts.speed ?? 500)));
		this.place(new Stroke(path, { ...opts, duration }), opts);
		return this;
	}

	/**
	 * A group with its own transform and opacity.
	 * build(innerTimeline, layer) fills it; inner times are relative to the layer.
	 * duration (for scheduling) defaults to the longer of its contents and fadeIn.
	 */
	layer(opts, build) {
		const layer = new Layer(opts);
		if (build) build(layer.timeline, layer);
		layer.duration = opts.duration ?? Math.max(layer.timeline.duration, layer.fadeIn);
		this.place(layer, opts);
		return this;
	}

	// Custom drawing code. duration defaults to fadeIn (or 0).
	clip(drawFn, opts = {}) {
		const clip = new Clip(drawFn, opts);
		clip.duration = opts.duration ?? clip.fadeIn;
		this.place(clip, opts);
		return this;
	}

	// Names a point in time (default: now) for later items to start at
	label(name, time = this.cursor) {
		this.labels[name] = time;
		return this;
	}

	wait(seconds) {
		this.cursor += seconds;
		return this;
	}

	get duration() {
		return this.cursor;
	}

	draw(ctx, time) {
		for (const item of this.items) item.draw(ctx, time);
	}
}
