/* ==========================================================================
   Objects
   Reusable scene pieces. Each one adds itself to a timeline as a layer:
     sun(tl, { x, y, ...timing })
   Inside the layer, draw around (0, 0); the layer handles placement.
   ========================================================================== */

import { PISTACHIO, LAVENDER, FLAMINGO, VANILLA, SOFTSKY, DENIM, rgba, shade } from './colours.js';
import { DrawPath } from './framework.js';
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

// Two leaves on a stalk: `a` and `b` are { at: 0..1 along the stalk, angle, length, width }
function stalkLeaves(s, stalk, a, b, duration, scale = 1) {
	const style = { color: shade(PISTACHIO, 0.35), lineWidth: 3 / scale, fill: PISTACHIO.rgb, duration };

	for (const [i, l] of [a, b].entries()) {
		const base = stalk.pointAt(l.at);
		s.add(leaf(base.x, base.y, l.length, l.width, l.angle), i === 0 ? style : { ...style, at: 'with', delay: duration * 0.4 });
	}
}

export function flower1(tl, { x = 0, y = 0, scale = 1, ...timing } = {}) {

	// (x, y) is the base of the stalk; scale keeps outlines the same width as the rest of the scene
	tl.layer({ x, y: y - STALK_HEIGHT * scale, scale, ...timing }, s => {

		// stalk, from the ground up to the head at (0, 0)
		const stalk = new DrawPath().moveTo(0, STALK_HEIGHT).cubicTo(-100, 300, 100, 100, 0, 0);
		s.add(stalk, {
			color: shade(PISTACHIO, 0.35), lineWidth: 4 / scale, duration: 1,
		});

		// leaves, drawn before the head so the petals sit over them
		stalkLeaves(s, stalk,
			{ at: 0.3, angle: -150, length: 110, width: 45 },
			{ at: 0.5, angle: -35, length: 90, width: 38 },
			0.6, scale);

		// head: its own layer, so petals and centre are drawn around (0, 0)
		s.layer({ x: 0, y: 0 }, h => {

			// back ring, then a front ring offset by half a petal
			h.add(petals(12, 40, 150, 50), {
				color: '#c2416b', lineWidth: 3 / scale, fill: 'rgba(236, 120, 160, 0.35)', duration: 1.5,
			});

			h.add(petals(12, 35, 110, 40, 15), {
				color: '#d4602a', lineWidth: 3 / scale, fill: 'rgba(242, 193, 78, 0.4)', duration: 1.2, at: 'with', delay: 0.4,
			});

			// centre on top, covering the petal bases
			h.add(new DrawPath().circle(0, 0, 50), {
				color: '#e0962f', lineWidth: 3 / scale, fill: 'rgba(224, 150, 47, 0.9)', duration: 0.6,
			});
		});

	});

}

export function flower2(tl, { x = 0, y = 0, scale = 1, ...timing } = {}) {

	// (x, y) is the base of the stalk; scale keeps outlines the same width as the rest of the scene
	tl.layer({ x, y: y - STALK_HEIGHT * scale, scale, ...timing }, s => {

		// stalk, from the ground up to the head at (0, 0)
		const stalk = new DrawPath().moveTo(0, STALK_HEIGHT).cubicTo(100, 300, -100, 100, 0, 0);
		s.add(stalk, {
			color: shade(PISTACHIO, 0.35), lineWidth: 4 / scale, duration: 0,
		});

		// leaves, kept low so the big petals don't cover them
		stalkLeaves(s, stalk,
			{ at: 0.15, angle: -30, length: 110, width: 45 },
			{ at: 0.35, angle: -150, length: 100, width: 40 },
			0, scale);

		// head: its own layer, so petals and centre are drawn around (0, 0)
		s.layer({ x: 0, y: 0 }, h => {

			// back ring, then a front ring offset by half a petal
			h.add(petals(5, 30, 200, 150), {
				color: '#c2416b', lineWidth: 3 / scale, fill: 'rgba(236, 120, 160, 0.35)', duration: 0,
			});

			// centre on top, covering the petal bases
			h.add(new DrawPath().circle(0, 0, 70), {
				color: '#e0962f', lineWidth: 3 / scale, fill: 'rgba(224, 150, 47, 0.9)', duration: 0,
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

export function flower3(tl, { x = 0, y = 0, scale = 1, ...timing } = {}) {

	// (x, y) is the base of the stalk; scale keeps outlines the same width as the rest of the scene
	tl.layer({ x, y: y - STALK_HEIGHT * scale, scale, ...timing }, s => {

		// stalk, from the ground up to the head at (0, 0)
		const stalk = new DrawPath().moveTo(0, STALK_HEIGHT).cubicTo(-60, 280, 80, 140, 0, 0);
		s.add(stalk, {
			color: shade(PISTACHIO, 0.35), lineWidth: 4 / scale, duration: 1,
		});

		stalkLeaves(s, stalk,
			{ at: 0.2, angle: -160, length: 110, width: 45 },
			{ at: 0.4, angle: -25, length: 95, width: 40 },
			0.6, scale);

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
				color: shade(LAVENDER, 0.45), lineWidth: 3 / scale, fill: rgba(LAVENDER, 0.85), duration: 1.8,
			});

			h.add(loopPetals(8, 34, 120, 50, 15, 22.5), {
				color: shade(FLAMINGO, 0.45), lineWidth: 3 / scale, fill: rgba(FLAMINGO, 0.9), duration: 1.4, at: 'with', delay: 0.5,
			});

			// centre covers where the petals hop from one to the next, with a little swirl on top
			h.add(new DrawPath().circle(0, 0, 38), {
				color: shade(VANILLA, 0.45), lineWidth: 3 / scale, fill: VANILLA.rgb, duration: 0.6,
			});

			h.add(spiral(2, 4, 26, -90), {
				color: shade(VANILLA, 0.45), lineWidth: 2.5 / scale, duration: 0.6, at: 'with', delay: 0.3,
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
 */
export function distantHills(tl, edge, bottom, { x = 0, y = 0, ...timing } = {}) {

	const ranges = [
		{ y: 60, amplitude: 60, spacing: 300, seed: 3, colour: LAVENDER },
		{ y: 175, amplitude: 55, spacing: 240, seed: 7, colour: SOFTSKY },
		{ y: 300, amplitude: 45, spacing: 200, seed: 12, colour: PISTACHIO },
	];

	tl.layer({ x, y, ...timing }, s => {
		for (const [i, r] of ranges.entries()) {
			const pts = hillRidge(edge, r.y, r.amplitude, r.spacing, r.seed);
			const first = pts[0][0], last = pts[pts.length - 1][0];

			// ridge first, so the pen draws the visible line before running off-screen to close the shape
			const hill = new DrawPath().smooth(pts).lineTo(last, bottom).lineTo(first, bottom).close();

			s.add(hill, {
				color: shade(r.colour, 0.3), lineWidth: 3, fill: r.colour.rgb, duration: 2.4,
				...(i > 0 && { at: 'with', delay: 0.5 }),
			});
		}
	});

}

/**
 * Snowy mountain with a smaller peak behind it. Sharp lines (lineTo) for
 * the rocky ridges and crags, smooth lines (smooth) for the foothills,
 * snow line and lower slopes. (x, y) is the middle of its base; the main
 * peak is 465 units above it.
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

		s.add(back, {
			color: shade(LAVENDER, 0.4), lineWidth, fill: LAVENDER.rgb, duration: 1.4,
		});

		const backSnow = new DrawPath().moveTo(-490, -231).lineTo(-460, -280).lineTo(-440, -257)
			.smooth([[-440, -257], [-450, -244], [-458, -256], [-470, -233], [-480, -243], [-490, -231]]);

		s.add(backSnow, {
			color: shade(LAVENDER, 0.4), lineWidth, fill: '#fbf8ff', duration: 0.5,
		});

		// Main peak
		const body = new DrawPath().smooth(leftSlope);
		for (const [px, py] of ridge) body.lineTo(px, py);
		body.smooth(rightSlope).close();

		s.add(body, {
			color: ink, lineWidth, fill: DENIM.rgb, duration: 2.2, at: 'with', delay: 0.3,
		});

		const snow = new DrawPath().moveTo(...snowTop[0]);
		for (const [px, py] of snowTop) snow.lineTo(px, py);
		snow.smooth(snowLine);

		s.add(snow, {
			color: ink, lineWidth, fill: '#f6f9fd', duration: 1.2,
		});

		// Shaded face: right of the crease. Drawn over the snow (see-through) so the snow is shaded too.
		const shadow = new DrawPath().moveTo(...ridge[8]);
		for (const [px, py] of ridge.slice(9)) shadow.lineTo(px, py);
		shadow.smooth(rightSlope).lineTo(...creaseBottom[creaseBottom.length - 1]);
		shadow.smooth([...creaseBottom].reverse());
		for (const [px, py] of [...creaseTop].reverse().slice(1)) shadow.lineTo(px, py);

		s.add(shadow, {
			stroke: false, fill: 'rgba(40, 62, 100, 0.22)', fillDuration: 0.8,
		});

		// The crease itself
		const crease = new DrawPath().moveTo(...creaseTop[0]);
		for (const [px, py] of creaseTop.slice(1)) crease.lineTo(px, py);
		crease.smooth(creaseBottom);

		s.add(crease, {
			color: ink, lineWidth, duration: 0.8, at: 'with',
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
				color: ink, lineWidth: 2.5 / scale, duration: 0.4, at: 'with', delay: i ? 0.12 : 0.4,
			});
		}

		for (const pts of folds) {
			s.add(new DrawPath().smooth(pts), {
				color: ink, lineWidth: 2.5 / scale, duration: 0.5, at: 'with', delay: 0.12,
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
