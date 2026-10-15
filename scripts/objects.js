/* ==========================================================================
   Objects
   Reusable scene pieces. Each one adds itself to a timeline as a layer:
     sun(tl, { x, y, ...timing })
   Inside the layer, draw around (0, 0); the layer handles placement.
   ========================================================================== */

import { PISTACHIO, LAVENDER, FLAMINGO, VANILLA, SOFTSKY, DENIM, rgba, shade } from './colours.js';
import { DrawPath, Ease, clamp01 } from './framework.js';
import { degrees2radians, polar2cartesian, noise1D } from './utilities.js';

export function rays(count, inner, outer, offsetDeg = 0) {
	const path = new DrawPath();
	const step = 360 / count;

	for (let i = 0; i < count; i++) {
		const angle = degrees2radians(offsetDeg + step * i);
		const a = polar2cartesian(inner, angle);
		const b = polar2cartesian(outer, angle);
		path.moveTo(a.x, a.y).lineTo(b.x, b.y);
	}

	return path;
}

// scale keeps outlines the same width as the rest of the scene.
// x, y, rotation and scale can also be functions of time (see Layer), e.g. to make it rise or spin.
export function sun(tl, { x = 0, y = 0, scale = 1, ...timing } = {}) {

	let longLen = 150;
	let shortLen = 75;

	// Line widths use the starting scale, so a function of time works too
	const sc = typeof scale === 'function' ? scale(0) : scale;

	tl.layer({ x, y, scale, ...timing }, s => {
		s.add(new DrawPath().circle(0, 0, 100), {
			color: '#e0962f', lineWidth: 3 / sc, fill: 'rgba(224, 150, 47, 0.25)', duration: 1,
		});


		// Long rays

		s.add(rays(12, 120, 120 + longLen), {
			color: '#d4602a', lineWidth: 4 / sc, duration: 0.8,
		});

		s.add(rays(12, 120 + longLen + 20, 120 + longLen + 20 + longLen), {
			color: '#d4602a', lineWidth: 4 / sc, duration: 0.8,
		});


		// Short Rays

		s.add(rays(12, 120, 120 + shortLen, 15), {
			color: '#f2c14e', lineWidth: 3 / sc, duration: 0.8, at: 'with', delay: 0.2,
		});

		s.add(rays(12, 120 + shortLen + 20, 120 + shortLen + 20 + 20, 15), {
			color: '#f2c14e', lineWidth: 3 / sc, duration: 0.8, at: 'with', delay: 0.2,
		});

		s.add(rays(12, 120 + shortLen + 20 + 40, 120 + shortLen + 20 + 40 + shortLen, 15), {
			color: '#f2c14e', lineWidth: 3 / sc, duration: 0.8, at: 'with', delay: 0.2,
		});


		// In between

		s.add(rays(12, 120, 120 + shortLen - 40, 20), {
			color: '#f2c15c', lineWidth: 3 / sc, duration: 0.8, at: 'with', delay: 0.2,
		});

		s.add(rays(12, 120, 120 + shortLen + 40, 40), {
			color: '#f3615c', lineWidth: 3 / sc, duration: 0.8, at: 'with', delay: 0.2,
		});

	});
}

export function hill1(tl, { x = 0, y = 0, ...timing } = {}) {

	tl.layer({ x, y, ...timing }, s => {

		s.add(new DrawPath().ellipse(0, 0, 750, 350, degrees2radians(10)), {
			color: '#e0962f', lineWidth: 3, fill: 'rgba(224, 150, 47, 0.25)', duration: 0, fillDuration: 0
		});

	});

}

export function betterHill1(tl, edge, { x = 0, y = 0, ...timing } = {}) {

	tl.layer({ x, y, ...timing }, s => {

		s.add(new DrawPath()
			.smooth([[-edge, 125], [-600, 150], [-500, 175], [-400, 190], [-300, 225], [-200, 260], [-100, 310], [0, 380], [100, 500], [200, 550], [200, 700], [-edge, 700]])
			.close(), {
			color: 'red', lineWidth: 3, fill: 'rgba(255, 0, 0, 0.25)', duration: 0,
		});
	});

}

export function hill2(tl, { x = 0, y = 0, ...timing } = {}) {

	tl.layer({ x, y, ...timing }, s => {

		s.add(new DrawPath().ellipse(0, 0, 1100, 350, degrees2radians(-10)), {
			color: 'lime', lineWidth: 3, fill: 'rgba(0, 255, 0, 0.25)', duration: 0, fillDuration: 0
		});
	});

}

export function hill3(tl, { x = 0, y = 0, ...timing } = {}) {

	tl.layer({ x, y, ...timing }, s => {

		s.add(new DrawPath().ellipse(0, 0, 1100, 350, degrees2radians(-5)), {
			color: 'red', lineWidth: 3, fill: 'rgba(255, 0, 0, 0.25)', duration: 0, fillDuration: 0
		});
	});

}

export function mountain(tl, edge, { x = 0, y = 0, ...timing } = {}) {

	tl.layer({ x, y, ...timing }, s => {

		s.add(new DrawPath()
			.smooth([[-edge, 0], [-300, -250], [0, -150], [350, -320], [edge, 0]])
			.close(), {
			color: 'red', lineWidth: 3, fill: 'rgba(255, 0, 0, 0.25)', duration: 0,
		});

		s.add(new DrawPath()
			.polygon([[-edge, 0], [-300, -250], [0, -150], [350, -320], [edge, 0]])
			.close(), {
			color: 'red', lineWidth: 3, fill: 'rgba(255, 0, 0, 0.25)', duration: 0,
		});
	});

}

// Adds one pointed petal/leaf outline to `path`, starting `inner` from (x, y) along `angle` (radians)
function petalShape(path, x, y, angle, inner, outer, width) {
	const cos = Math.cos(angle), sin = Math.sin(angle);
	const len = outer - inner;
	const half = width / 2;

	// Designed pointing along +x (u = along, v = across), then rotated into place
	const p = (u, v) => [x + u * cos - v * sin, y + u * sin + v * cos];

	path.moveTo(...p(inner, 0));
	path.cubicTo(...p(inner + len * 0.25, -half * 1.3), ...p(outer - len * 0.2, -half * 0.9), ...p(outer, 0));
	path.cubicTo(...p(outer - len * 0.2, half * 0.9), ...p(inner + len * 0.25, half * 1.3), ...p(inner, 0));
	return path;
}

/**
 * Ring of pointed petals around (0, 0), one closed shape per petal.
 * Each petal runs from radius `inner` out to its tip at `outer`, `width` across at its widest.
 * Each petal starts with moveTo, so they aren't joined by connecting lines.
 */
export function petals(count, inner, outer, width, offsetDeg = 0) {
	const path = new DrawPath();
	const step = 360 / count;

	for (let i = 0; i < count; i++) {
		petalShape(path, 0, 0, degrees2radians(offsetDeg + step * i), inner, outer, width);
	}

	return path;
}

/**
 * Leaf growing from (x, y) towards `angleDeg` (0 = right, -90 = up), with a midrib.
 */
export function leaf(x, y, length, width, angleDeg) {
	const angle = degrees2radians(angleDeg);
	const path = petalShape(new DrawPath(), x, y, angle, 0, length, width);
	const tip = polar2cartesian(length * 0.8, angle);
	return path.moveTo(x, y).lineTo(x + tip.x, y + tip.y);
}

// Flowers are drawn with the head at (0, 0) and the stalk base this far below it
const STALK_HEIGHT = 400;

// Roughly how far the biggest flower head reaches from its centre (before scaling)
const FLOWER_RADIUS = 200;

// Two leaves on a stalk: `a` and `b` are { at: 0..1 along the stalk, angle, length, width }
function stalkLeaves(s, stalk, a, b, duration, scale = 1) {
	const style = { color: shade(PISTACHIO, 0.35), lineWidth: 3 / scale, fill: PISTACHIO.rgb, duration };

	for (const [i, l] of [a, b].entries()) {
		const base = stalk.pointAt(l.at);
		s.add(leaf(base.x, base.y, l.length, l.width, l.angle), i === 0 ? style : { ...style, at: 'with', delay: duration * 0.4 });
	}
}

export function flower1(tl, { x = 0, y = 0, scale = 1, line = 1, ...timing } = {}) {

	const lw = line / scale; // outline widths: the same as the rest of the scene, times `line`

	// (x, y) is the base of the stalk; scale keeps outlines the same width as the rest of the scene
	tl.layer({ x, y: y - STALK_HEIGHT * scale, scale, ...timing }, s => {

		// stalk, from the ground up to the head at (0, 0)
		const stalk = new DrawPath().moveTo(0, STALK_HEIGHT).cubicTo(-100, 300, 100, 100, 0, 0);
		s.add(stalk, {
			color: shade(PISTACHIO, 0.35), lineWidth: 4 * lw, duration: 1,
		});

		// leaves, drawn before the head so the petals sit over them
		stalkLeaves(s, stalk,
			{ at: 0.3, angle: -150, length: 110, width: 45 },
			{ at: 0.5, angle: -35, length: 90, width: 38 },
			0.6, scale / line);

		// head: its own layer, so petals and centre are drawn around (0, 0)
		s.layer({ x: 0, y: 0 }, h => {

			// back ring, then a front ring offset by half a petal
			h.add(petals(12, 40, 150, 50), {
				color: '#c2416b', lineWidth: 3 * lw, fill: 'rgba(236, 120, 160, 0.35)', duration: 1.5,
			});

			h.add(petals(12, 35, 110, 40, 15), {
				color: '#d4602a', lineWidth: 3 * lw, fill: 'rgba(242, 193, 78, 0.4)', duration: 1.2, at: 'with', delay: 0.4,
			});

			// centre on top, covering the petal bases
			h.add(new DrawPath().circle(0, 0, 50), {
				color: '#e0962f', lineWidth: 3 * lw, fill: 'rgba(224, 150, 47, 0.9)', duration: 0.6,
			});
		});

	});

}

export function flower2(tl, { x = 0, y = 0, scale = 1, line = 1, ...timing } = {}) {

	const lw = line / scale; // outline widths: the same as the rest of the scene, times `line`

	// (x, y) is the base of the stalk; scale keeps outlines the same width as the rest of the scene
	tl.layer({ x, y: y - STALK_HEIGHT * scale, scale, ...timing }, s => {

		// stalk, from the ground up to the head at (0, 0)
		const stalk = new DrawPath().moveTo(0, STALK_HEIGHT).cubicTo(100, 300, -100, 100, 0, 0);
		s.add(stalk, {
			color: shade(PISTACHIO, 0.35), lineWidth: 4 * lw, duration: 1,
		});

		// leaves, kept low so the big petals don't cover them
		stalkLeaves(s, stalk,
			{ at: 0.15, angle: -30, length: 110, width: 45 },
			{ at: 0.35, angle: -150, length: 100, width: 40 },
			0.6, scale / line);

		// head: its own layer, so petals and centre are drawn around (0, 0)
		s.layer({ x: 0, y: 0 }, h => {

			// back ring, then a front ring offset by half a petal
			h.add(petals(5, 30, 200, 150), {
				color: '#c2416b', lineWidth: 3 * lw, fill: 'rgba(236, 120, 160, 0.35)', duration: 1.5,
			});

			// centre on top, covering the petal bases
			h.add(new DrawPath().circle(0, 0, 70), {
				color: '#e0962f', lineWidth: 3 * lw, fill: 'rgba(224, 150, 47, 0.9)', duration: 0.6,
			});
		});

	});

}


/**
 * Adds one loopy petal to `path`. The pen leaves the centre on one side,
 * swings round a rounded end and crosses back over itself near the base,
 * like a loop of ribbon, ending on the other side ready for the next petal.
 * `neck` is how far either side of the centre line the petal starts and ends.
 */
function loopPetalShape(path, angle, inner, outer, width, neck) {
	const cos = Math.cos(angle), sin = Math.sin(angle);
	const half = width / 2;
	const capCentre = outer - half;                     // round end: a half circle reaching out to `outer`
	const reach = inner + (capCentre - inner) * 0.6;    // pulls the crossover out past the flower's centre

	// Designed pointing along +x (u = along, v = across), then rotated into place
	const p = (u, v) => [u * cos - v * sin, u * sin + v * cos];
	const [cx, cy] = p(capCentre, 0);

	if (path.points.length) path.lineTo(...p(inner, -neck));
	else path.moveTo(...p(inner, -neck));

	path.cubicTo(...p(reach, neck * 1.2), ...p(capCentre - half * 0.9, half), ...p(capCentre, half));
	path.ellipseArc(cx, cy, half, half, 0, angle + Math.PI / 2, angle - Math.PI / 2);
	path.cubicTo(...p(capCentre - half * 0.9, -half), ...p(reach, -neck * 1.2), ...p(inner, neck));
	return path;
}

/**
 * Ring of loopy, round-ended petals around (0, 0), drawn as ONE continuous
 * line, so the pen loops from petal to petal like a doodle.
 * Keep `inner` inside the flower's centre: the short hops between petals happen there.
 */
export function loopPetals(count, inner, outer, width, neck = 10, offsetDeg = 0) {
	const path = new DrawPath();
	const step = 360 / count;

	for (let i = 0; i < count; i++) {
		loopPetalShape(path, degrees2radians(offsetDeg + step * i), inner, outer, width, neck);
	}

	return path.close();
}

// Little spiral, for the middle of a flower
export function spiral(turns, r0, r1, startDeg = 0) {
	const path = new DrawPath();
	const steps = Math.ceil(turns * 36);

	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const { x, y } = polar2cartesian(r0 + (r1 - r0) * t, degrees2radians(startDeg + turns * 360 * t));
		path.lineTo(x, y);
	}

	return path;
}

export function flower3(tl, { x = 0, y = 0, scale = 1, line = 1, ...timing } = {}) {

	const lw = line / scale; // outline widths: the same as the rest of the scene, times `line`

	// (x, y) is the base of the stalk; scale keeps outlines the same width as the rest of the scene
	tl.layer({ x, y: y - STALK_HEIGHT * scale, scale, ...timing }, s => {

		// stalk, from the ground up to the head at (0, 0)
		const stalk = new DrawPath().moveTo(0, STALK_HEIGHT).cubicTo(-60, 280, 80, 140, 0, 0);
		s.add(stalk, {
			color: shade(PISTACHIO, 0.35), lineWidth: 4 * lw, duration: 1,
		});

		stalkLeaves(s, stalk,
			{ at: 0.2, angle: -160, length: 110, width: 45 },
			{ at: 0.4, angle: -25, length: 95, width: 40 },
			0.6, scale / line);

		// head: its own layer, so petals and centre are drawn around (0, 0)
		s.layer({ x: 0, y: 0 }, h => {

			// soft disc behind the petals, so the gaps between the loops' crossed bases aren't see-through.
			// Added first so it sits underneath, but fades in as the back ring finishes
			h.add(new DrawPath().circle(0, 0, 85), {
				stroke: false, fill: rgba(LAVENDER, 0.85), fillDuration: 0.6, at: 1.4,
			});

			// back ring, then a smaller front ring offset by half a petal, each one continuous loopy line
			h.add(loopPetals(8, 34, 175, 78, 20), {
				at: 0,
				color: shade(LAVENDER, 0.45), lineWidth: 3 * lw, fill: rgba(LAVENDER, 0.85), duration: 1.8,
			});

			h.add(loopPetals(8, 34, 120, 50, 15, 22.5), {
				color: shade(FLAMINGO, 0.45), lineWidth: 3 * lw, fill: rgba(FLAMINGO, 0.9), duration: 1.4, at: 'with', delay: 0.5,
			});

			// centre covers where the petals hop from one to the next, with a little swirl on top
			h.add(new DrawPath().circle(0, 0, 38), {
				color: shade(VANILLA, 0.45), lineWidth: 3 * lw, fill: VANILLA.rgb, duration: 0.6,
			});

			h.add(spiral(2, 4, 26, -90), {
				color: shade(VANILLA, 0.45), lineWidth: 2.5 * lw, duration: 0.6, at: 'with', delay: 0.3,
			});
		});

	});

}

/**
 * One rolling hill line across the whole screen, built from noise so it
 * always reaches both edges however wide the screen is. Points sit on a
 * grid anchored at x = 0, so the middle keeps its shape when resizing.
 */
function hillRidge(edge, baseY, amplitude, spacing, seed) {
	const pts = [];
	for (let i = Math.floor(-edge / spacing); i <= Math.ceil(edge / spacing); i++) {
		const n = noise1D(i * 0.7, seed) + noise1D(i * 1.9, seed + 1) * 0.35;
		pts.push([i * spacing, baseY - amplitude * n]);
	}
	return pts;
}

/**
 * Layers of soft, rolling hills, furthest first. Each one runs off both
 * sides of the screen and fills down past the bottom (`bottom` = halfH + a bit).
 *
 * onHill(s, hill, hills) runs straight after each hill is added, before the
 * next (nearer) one, so whatever it adds sits on that hill and is tucked
 * behind the hills in front. hill = { index, start, end, surfaceAt(x) }:
 * surfaceAt gives the y of the hilltop line at any x, start / end are when
 * the hill starts drawing and finishes filling in (relative to this layer).
 * `hills` is all of them, furthest first, for things that need the hill in front.
 *
 * startFor(index) sets when each hill starts (index 0 = furthest).
 * By default they start half a second apart, back to front.
 */
export function distantHills(tl, edge, bottom, {
	x = 0, y = 0, onHill = null,
	startFor = i => i * 0.5, duration = 2.4, fillDuration = 0.6,
	...timing
} = {}) {

	const ranges = [
		{ y: 60, amplitude: 60, spacing: 300, seed: 3, colour: LAVENDER },
		{ y: 175, amplitude: 55, spacing: 240, seed: 7, colour: SOFTSKY },
		{ y: 300, amplitude: 45, spacing: 200, seed: 12, colour: PISTACHIO },
	];

	// Work out every ridge first: things on one hill may need to know about the hill in front
	const hills = ranges.map((r, i) => {
		const pts = hillRidge(edge, r.y, r.amplitude, r.spacing, r.seed);
		const ridge = new DrawPath().smooth(pts);
		const start = startFor(i);
		return { index: i, colour: r.colour, pts, start, end: start + duration + fillDuration, surfaceAt: px => surfaceAt(ridge, px) };
	});

	tl.layer({ x, y, ...timing }, s => {
		for (const hill of hills) {
			const { pts, colour } = hill;
			const first = pts[0][0], last = pts[pts.length - 1][0];

			// ridge first, so the pen draws the visible line before running off-screen to close the shape
			const shape = new DrawPath().smooth(pts).lineTo(last, bottom).lineTo(first, bottom).close();

			s.add(shape, {
				color: shade(colour, 0.3), lineWidth: 3, fill: colour.rgb, duration, fillDuration, at: hill.start,
			});

			if (onHill) onHill(s, hill, hills);
		}
	});

}

// y of a left-to-right line (like a hill ridge) at x, from its sampled points
function surfaceAt(path, x) {
	const pts = path.points;
	if (x <= pts[0].x) return pts[0].y;
	for (let i = 1; i < pts.length; i++) {
		if (pts[i].x >= x) {
			const a = pts[i - 1], b = pts[i];
			return a.y + (b.y - a.y) * ((x - a.x) / (b.x - a.x || 1));
		}
	}
	return pts[pts.length - 1].y;
}

/**
 * Scatters flowers over a hill (use it from distantHills' onHill).
 * Each flower gets a random type, a random left/right flip and a random
 * spot a little below the hilltop. Size comes from `perspective(y)`, so the
 * further up the screen (further away) a flower stands, the smaller it is.
 *
 * @param {object} opts
 * @param {number} opts.count          how many flowers
 * @param {number} opts.edge           spread them from -edge to edge
 * @param {[number, number]} opts.depth  how far below the hilltop the stalk base can be [min, max]
 * @param {function} opts.perspective  y => scale
 * @param {function} opts.random       0..1 generator (use seededRandom so the layout is stable)
 * @param {number} [opts.start=0]      first flower starts growing at this time
 * @param {number} [opts.spread=3]     the rest start at random over this many seconds
 * @param {function} [opts.avoid]      (x, y, radius) => true to keep a flower out of a spot (e.g. a path)
 */
export function meadow(tl, surfaceAt, { count, edge, depth, perspective, random, start = 0, spread = 3, avoid = null }) {
	const kinds = [flower1, flower2, flower3];
	const flowers = [];

	for (let i = 0; i < count; i++) {
		// even spacing with a random nudge, so they cover the hill without clumping.
		// A few tries to find a free spot; if there isn't one, this flower is skipped
		let x, y, scale, free = false;
		for (let attempt = 0; attempt < 8 && !free; attempt++) {
			x = -edge + (2 * edge) * ((i + 0.15 + random() * 0.7) / count);
			y = surfaceAt(x) + depth[0] + random() * (depth[1] - depth[0]);
			scale = perspective(y);

			// check where the stalk meets the ground and where the head is
			free = !avoid || (!avoid(x, y, 10) && !avoid(x, y - STALK_HEIGHT * scale, FLOWER_RADIUS * scale));
		}
		if (!free) continue;

		flowers.push({
			kind: kinds[Math.floor(random() * kinds.length)],
			x, y, scale,
			line: Math.min(1, 0.4 + scale * 1.2),  // finer outlines on far-away flowers
			flipX: random() < 0.5,
			at: start + random() * spread,
		});
	}

	// furthest (highest up) first, so nearer flowers overlap them
	flowers.sort((a, b) => a.y - b.y);
	for (const { kind, ...opts } of flowers) kind(tl, opts);
}

/**
 * Snowy mountain with a smaller peak behind it. Sharp lines (lineTo) for
 * the rocky ridges and crags, smooth lines (smooth) for the foothills,
 * snow line and lower slopes. (x, y) is the middle of its base; the main
 * peak is 465 units above it. The main peak draws first (about 4s), then
 * the one behind it; the whole thing takes about 6s.
 */
export function detailedMountain(tl, { x = 0, y = 0, scale = 1, ...timing } = {}) {

	const ink = shade(DENIM, 0.45);
	const lineWidth = 3 / scale;

	// Main peak, left to right: soft foothill, jagged ridge, soft foothill
	const leftSlope = [[-650, 0], [-560, -30], [-470, -85], [-400, -150]];
	const ridge = [
		[-400, -150], [-330, -215], [-300, -200], [-230, -290], [-200, -278],
		[-140, -355], [-110, -345], [-45, -430], [0, -465], [45, -415],
		[75, -425], [140, -345], [170, -355], [230, -280], [265, -290], [300, -225],
	];
	const rightSlope = [[300, -225], [380, -145], [470, -75], [560, -28], [650, 0]];

	// Snow: the top follows the ridge, the bottom is a wavy line of drips (right to left)
	const snowTop = ridge.slice(5, 13);
	const snowLine = [
		[140, -345], [115, -330], [95, -350], [70, -310], [45, -340], [20, -300],
		[-5, -335], [-30, -305], [-60, -340], [-95, -322], [-120, -345], [-140, -355],
	];

	// The crease down from the summit that splits sunlit and shaded faces:
	// crisp and rocky near the top, softening as it reaches the foothills
	const creaseTop = [[0, -465], [18, -400], [-6, -345], [22, -280]];
	const creaseBottom = [[22, -280], [5, -200], [35, -120], [20, -50], [50, 0]];

	tl.layer({ x, y, scale, ...timing }, s => {

		// Smaller peak behind, paler, so the main one stands out
		const back = new DrawPath()
			.smooth([[-720, 0], [-650, -50], [-590, -120]]);
		for (const [px, py] of [[-540, -200], [-515, -190], [-460, -280], [-420, -235], [-390, -245], [-340, -170]]) back.lineTo(px, py);
		back.smooth([[-340, -170], [-300, -120], [-250, -60], [-200, 0]]).close();

		// Times below are set explicitly: the main peak draws first, then this one,
		// though this one is added first so it sits behind.
		s.add(back, {
			color: shade(LAVENDER, 0.4), lineWidth, fill: LAVENDER.rgb, duration: 1.2, fillDuration: 0.5, at: 4,
		});

		const backSnow = new DrawPath().moveTo(-490, -231).lineTo(-460, -280).lineTo(-440, -257)
			.smooth([[-440, -257], [-450, -244], [-458, -256], [-470, -233], [-480, -243], [-490, -231]]);

		s.add(backSnow, {
			color: shade(LAVENDER, 0.4), lineWidth, fill: '#fbf8ff', duration: 0.4, at: 5.4,
		});

		// Main peak
		const body = new DrawPath().smooth(leftSlope);
		for (const [px, py] of ridge) body.lineTo(px, py);
		body.smooth(rightSlope).close();

		s.add(body, {
			color: ink, lineWidth, fill: DENIM.rgb, duration: 1.8, fillDuration: 0.5, at: 0,
		});

		const snow = new DrawPath().moveTo(...snowTop[0]);
		for (const [px, py] of snowTop) snow.lineTo(px, py);
		snow.smooth(snowLine);

		s.add(snow, {
			color: ink, lineWidth, fill: '#f6f9fd', duration: 1, fillDuration: 0.4, at: 1.8,
		});

		// Shaded face: right of the crease. Drawn over the snow (see-through) so the snow is shaded too.
		const shadow = new DrawPath().moveTo(...ridge[8]);
		for (const [px, py] of ridge.slice(9)) shadow.lineTo(px, py);
		shadow.smooth(rightSlope).lineTo(...creaseBottom[creaseBottom.length - 1]);
		shadow.smooth([...creaseBottom].reverse());
		for (const [px, py] of [...creaseTop].reverse().slice(1)) shadow.lineTo(px, py);

		s.add(shadow, {
			stroke: false, fill: 'rgba(40, 62, 100, 0.22)', fillDuration: 0.8, at: 2.8,
		});

		// The crease itself
		const crease = new DrawPath().moveTo(...creaseTop[0]);
		for (const [px, py] of creaseTop.slice(1)) crease.lineTo(px, py);
		crease.smooth(creaseBottom);

		s.add(crease, {
			color: ink, lineWidth, duration: 0.8, at: 2.8,
		});

		// Rocky crags: short, sharp zig-zags
		const crags = [
			[[-230, -250], [-210, -215], [-220, -180]],
			[[-170, -300], [-150, -262], [-160, -230], [-140, -200]],
			[[80, -240], [95, -200], [85, -160]],
			[[120, -300], [140, -260], [125, -220]],
			[[200, -250], [215, -210], [200, -170], [220, -140]],
		];

		// Gentle folds in the foothills: smooth lines
		const folds = [
			[[-520, -40], [-460, -60], [-400, -55], [-340, -70]],
			[[-300, -120], [-240, -140], [-180, -130]],
			[[380, -90], [440, -70], [500, -40]],
		];

		for (const [i, pts] of crags.entries()) {
			s.add(polyline(pts), {
				color: ink, lineWidth: 2.5 / scale, duration: 0.4, at: 3 + i * 0.12,
			});
		}

		for (const [i, pts] of folds.entries()) {
			s.add(new DrawPath().smooth(pts), {
				color: ink, lineWidth: 2.5 / scale, duration: 0.5, at: 3.5 + i * 0.12,
			});
		}
	});

}

// Open line through a list of [x, y] points (polygon() closes the shape, this doesn't)
export function polyline(pts) {
	const path = new DrawPath();
	for (const [x, y] of pts) path.lineTo(x, y);
	return path;
}

/**
 * A path winding up over the hills towards the mountain, narrowing with
 * distance. It's drawn in pieces, one per hill: each piece climbs that
 * hill's face from just behind the hill in front, up to its crest, so it
 * dips out of sight behind each hilltop and reappears on the next.
 *
 * `route` has one entry per hill, furthest first: { from, to, bend }
 *   from - x where the piece comes out from behind the hill in front (or the bottom of the screen)
 *   to   - x where it goes over this hill's crest
 *   bend - how far it swings sideways along the way
 *
 * Returns { draw(s, hill, hills, at), avoid(x, y, radius) }.
 * Call draw from distantHills' onHill so each piece sits on its own hill.
 */
export function hillPath(route, { bottom, halfWidth, colour = VANILLA, lineWidth = 2.5 }) {
	const pieces = [];

	// Centre line of one piece at s (0 = bottom end, 1 = crest)
	const centre = (piece, s) => ({
		x: piece.from + (piece.to - piece.from) * s + piece.bend * Math.sin(Math.PI * Math.min(s, 1)),
		y: piece.y0 + (piece.y1 - piece.y0) * s,
	});

	// One edge (side = -1 left, 1 right), cut off exactly where it crosses the hilltop
	function edgeLine(piece, side, surfaceAt) {
		const pts = [];
		const steps = 40;
		for (let i = 0; i <= steps * 1.5; i++) {
			const c = centre(piece, i / steps);
			const p = { x: c.x + side * halfWidth(c.y), y: c.y };
			const above = p.y - surfaceAt(p.x); // < 0 once the edge is over the crest

			if (above < 0 && pts.length) {
				const prev = pts[pts.length - 1];
				const before = prev.y - surfaceAt(prev.x);
				const k = before / (before - above);
				pts.push({ x: prev.x + (p.x - prev.x) * k, y: prev.y + (p.y - prev.y) * k });
				break;
			}
			pts.push(p);
		}
		return pts;
	}

	function build(hill, hills) {
		const leg = route[hill.index];
		const nearer = hills[hill.index + 1];

		// start hidden behind the hill in front (or below the screen), finish at this crest
		const y0 = nearer ? nearer.surfaceAt(leg.from) + 30 : bottom;
		const piece = { ...leg, y0, y1: hill.surfaceAt(leg.to) };
		piece.left = edgeLine(piece, -1, hill.surfaceAt);
		piece.right = edgeLine(piece, 1, hill.surfaceAt);
		pieces[hill.index] = piece;
		return piece;
	}

	return {
		/**
		 * Adds the piece of path that sits on `hill`: both edges draw at once over
		 * `duration`, then the path's surface fades in between them.
		 */
		draw(s, hill, hills, at, duration = 1) {
			const piece = build(hill, hills);
			if (!piece.left.length || !piece.right.length) return;

			const surface = new DrawPath();
			for (const p of piece.left) surface.lineTo(p.x, p.y);
			for (const p of [...piece.right].reverse()) surface.lineTo(p.x, p.y);
			surface.close();

			// surface first so the edges sit on top of it, but it fades in after they're drawn
			s.add(surface, { stroke: false, fill: colour.rgb, fillDuration: 0.5, at: at + duration });

			for (const side of [piece.left, piece.right]) {
				const line = new DrawPath();
				for (const p of side) line.lineTo(p.x, p.y);
				s.add(line, { color: shade(colour, 0.4), lineWidth, duration, ease: Ease.linear, at });
			}
		},

		// true if a circle at (x, y) with this radius touches the path (pieces drawn so far)
		avoid(x, y, radius = 0) {
			for (const piece of pieces) {
				if (!piece) continue;
				const s = (y - piece.y0) / (piece.y1 - piece.y0);
				if (s < -0.05 || s > 1.5) continue;
				const c = centre(piece, s);
				if (Math.abs(x - c.x) < halfWidth(y) + radius + 6) return true;
			}
			return false;
		},
	};
}

/**
 * Little tufts of grass over a hill that sway in a breeze. The breeze is a
 * couple of slow waves rolling across the screen from left to right, so
 * neighbouring tufts move together and gusts travel across the hills.
 * The tufts sprout (grow up) when the clip starts.
 *
 * @param {object} opts
 * @param {number} opts.count          how many tufts
 * @param {number} opts.edge           spread them from -edge to edge
 * @param {[number, number]} opts.depth  how far below the hilltop they can be [min, max]
 * @param {function} opts.perspective  y => scale (same one as the flowers)
 * @param {function} opts.random       0..1 generator
 * @param {object} opts.colour         palette colour of the hill (the grass is a darker shade of it)
 * @param {function} [opts.avoid]      (x, y, radius) => true to keep grass off a spot
 * @param {number} [opts.height=130]   blade height before perspective scaling
 * @param {number} [opts.breeze=0.22]  how far the blades lean in the breeze (radians, roughly)
 */
export function grass(tl, surfaceAt, { count, edge, depth, perspective, random, colour, avoid = null, height = 130, breeze = 0.22, ...timing }) {
	const tufts = [];

	for (let i = 0; i < count; i++) {
		const x = -edge + (2 * edge) * ((i + random()) / count);
		const y = surfaceAt(x) + depth[0] + random() * (depth[1] - depth[0]);
		if (avoid && avoid(x, y, 4)) continue;

		const size = height * perspective(y);
		const blades = [];
		const n = 2 + Math.floor(random() * 3);
		for (let b = 0; b < n; b++) {
			blades.push({
				dx: (random() - 0.5) * size * 0.5,     // spread along the ground
				h: size * (0.6 + random() * 0.5),
				lean: (random() - 0.5) * 0.7,           // resting lean, as a fraction of height
				delay: random() * 0.6,                  // so they don't all sprout at once
			});
		}
		tufts.push({ x, y, blades, phase: random() * 0.6 });
	}

	const ink = shade(colour, 0.4);

	tl.clip((ctx, t) => {
		ctx.strokeStyle = ink;
		ctx.lineWidth = 1.6;
		ctx.lineCap = 'round';
		ctx.beginPath();

		// The breeze runs on the real clock, so it keeps a natural pace even
		// when the scene around it is slowed down
		const now = performance.now() / 1000;

		for (const tuft of tufts) {
			// breeze at this spot: two waves travelling left to right, plus a little flutter
			const wind = breeze * (
				0.65 * Math.sin(now * 1.3 - tuft.x * 0.006) +
				0.35 * Math.sin(now * 0.55 - tuft.x * 0.0025 + 1.7) +
				0.15 * Math.sin(now * 4.1 + tuft.phase * 10)
			);

			for (const b of tuft.blades) {
				const grow = Ease.outBack(clamp01((t - b.delay) / 0.7));
				if (grow <= 0) continue;

				const h = b.h * grow;
				const bx = tuft.x + b.dx, by = tuft.y;
				const tipX = bx + (b.lean + wind) * h;
				const tipY = by - h * (1 - 0.25 * Math.abs(b.lean + wind));  // bending shortens the blade a little

				// curved blade: the tip bends more than the base
				ctx.moveTo(bx, by);
				ctx.quadraticCurveTo(bx + (b.lean + wind) * h * 0.15, by - h * 0.6, tipX, tipY);
			}
		}

		ctx.stroke();
	}, { duration: 1.3, ...timing });
}
