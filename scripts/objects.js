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
