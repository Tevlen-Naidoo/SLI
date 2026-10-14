/* ==========================================================================
   Objects
   Reusable scene pieces. Each one adds itself to a timeline as a layer:
     sun(tl, { x, y, ...timing })
   Inside the layer, draw around (0, 0); the layer handles placement.
   ========================================================================== */

import { DrawPath } from './framework.js';
import { degrees2radians, polar2cartesian } from './utilities.js';

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

export function sun(tl, { x = 0, y = 0, ...timing } = {}) {

	let longLen = 150;
	let shortLen = 75;

	tl.layer({ x, y, ...timing }, s => {
		s.add(new DrawPath().circle(0, 0, 100), {
			color: '#e0962f', lineWidth: 3, fill: 'rgba(224, 150, 47, 0.25)', duration: 1,
		});


		// Long rays

		s.add(rays(12, 120, 120 + longLen), {
			color: '#d4602a', lineWidth: 4, duration: 0.8,
		});

		s.add(rays(12, 120 + longLen + 20, 120 + longLen + 20 + longLen), {
			color: '#d4602a', lineWidth: 4, duration: 0.8,
		});


		// Short Rays

		s.add(rays(12, 120, 120 + shortLen, 15), {
			color: '#f2c14e', lineWidth: 3, duration: 0.8, at: 'with', delay: 0.2,
		});

		s.add(rays(12, 120 + shortLen + 20, 120 + shortLen + 20 + 20, 15), {
			color: '#f2c14e', lineWidth: 3, duration: 0.8, at: 'with', delay: 0.2,
		});

		s.add(rays(12, 120 + shortLen + 20 + 40, 120 + shortLen + 20 + 40 + shortLen, 15), {
			color: '#f2c14e', lineWidth: 3, duration: 0.8, at: 'with', delay: 0.2,
		});


		// In between

		s.add(rays(12, 120, 120 + shortLen - 40, 20), {
			color: '#f2c15c', lineWidth: 3, duration: 0.8, at: 'with', delay: 0.2,
		});

		s.add(rays(12, 120, 120 + shortLen + 40, 40), {
			color: '#f3615c', lineWidth: 3, duration: 0.8, at: 'with', delay: 0.2,
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
	const style = { color: '#2f6b2a', lineWidth: 3 / scale, fill: 'rgba(92, 160, 72, 0.5)', duration };

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
			color: '#4a8a3a', lineWidth: 4 / scale, duration: 1,
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
			color: '#4a8a3a', lineWidth: 4 / scale, duration: 0,
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

