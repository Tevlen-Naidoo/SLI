import { Stage, DrawPath, Timeline } from './framework.js';
import { degrees2radians, polar2cartesian } from './utilities.js';

const DEBUG = false; // true = show the design area outline

const stage = new Stage(document.getElementById('background'), {
	designWidth: 1600,
	designHeight: 900,
});

let timeline = null;

function rays(count, inner, outer, offsetDeg = 0) {
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

function sun(tl, { x = 0, y = 0, ...timing } = {}) {

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

// function sun() {
// 	const path = new DrawPath();
//
// 	// The actual sun
// 	path.circle(0, 0, 100);
//
// 	for (let i = 0; i < 12; i++) {
// 		let angle = degrees2radians(30 * i);
// 		const inner = polar2cartesian(120, angle);
// 		const outer = polar2cartesian(200, angle);
// 		path.moveTo(inner.x, inner.y).lineTo(outer.x, outer.y);
// 	}
//
// 	for (let i = 1; i < 12; i++) {
// 		let angle = degrees2radians(60 * i);
// 		const inner = polar2cartesian(120, angle);
// 		const outer = polar2cartesian(250, angle);
// 		path.moveTo(inner.x, inner.y).lineTo(outer.x, outer.y);
// 	}
//
// 	return path;
// }

/* ==========================================================================
   Scene
   (0, 0) is the screen centre. The 1600 x 900 design area (x -800..800,
   y -450..450) is always visible. halfW / halfH are the visible edges,
   slightly larger on screens that aren't exactly 16:9.
   ========================================================================== */

function buildScene({ halfW }) {
	const tl = new Timeline();
	// const edge = halfW + 20; // run slightly past the edge so line caps aren't visible

	// tl.add(sun(), {
	// 	color: "#e0962f",
	// 	lineWidth: 3,
	// 	fill: "rgba(224, 150, 47, 0.25)",
	// 	duration: 0
	// });

	sun(tl, { x: 0, y: 0 });

	return tl;
}


/* ==========================================================================
   Run
   ========================================================================== */

stage.onResize = s => { timeline = buildScene(s); };
stage.onResize(stage);

stage.canvas.addEventListener('click', () => stage.restart());

stage.start({
	draw(ctx, time) {
		timeline.draw(ctx, time);
		if (DEBUG) stage.drawDesignArea();
	},
});
