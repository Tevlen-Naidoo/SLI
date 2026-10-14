import { Stage, DrawPath, Timeline } from './framework.js';
import { degrees2radians, polar2cartesian } from './utilities.js';

const DEBUG = true; // true = show the coordinate grid and design area outline

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

function hill1(tl, { x = 0, y = 0, ...timing } = {}) {

	tl.layer({ x, y, ...timing }, s => {

		s.add(new DrawPath().ellipse(0, 0, 750, 350, degrees2radians(10)), {
			color: '#e0962f', lineWidth: 3, fill: 'rgba(224, 150, 47, 0.25)', duration: 0, fillDuration: 0
		});
	});

}

function hill2(tl, { x = 0, y = 0, ...timing } = {}) {

	tl.layer({ x, y, ...timing }, s => {

		s.add(new DrawPath().ellipse(0, 0, 1100, 350, degrees2radians(-10)), {
			color: 'lime', lineWidth: 3, fill: 'rgba(0, 255, 0, 0.25)', duration: 0, fillDuration: 0
		});
	});

}

/* ==========================================================================
   Scene
   (0, 0) is the screen centre. The 1600 x 900 design area (x -800..800,
   y -450..450) is always visible. halfW / halfH are the visible edges,
   slightly larger on screens that aren't exactly 16:9.
   ========================================================================== */

function buildScene({ halfW }) {
	const tl = new Timeline();
	const edge = halfW + 20; // run slightly past the edge so line caps aren't visible


	// sun(tl, { x: 0, y: 0 });
	hill1(tl, { x: -edge + 200, y: 500 });
	hill2(tl, { x: edge - 300, y: 500 });

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
		if (DEBUG) stage.drawGrid();
		timeline.draw(ctx, time);
		if (DEBUG) stage.drawDesignArea();
	},
});
