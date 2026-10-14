import { Stage, Timeline } from './framework.js';
import { sun, hill1, betterHill1, hill2, hill3, mountain } from './objects.js';

const DEBUG = true; // true = show the coordinate grid and design area outline

const stage = new Stage(document.getElementById('background'), {
	designWidth: 1600,
	designHeight: 900,
});

let timeline = null;

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
	betterHill1(tl, edge, { x: 0, y: 0 });
	// hill2(tl, { x: edge - 300, y: 500 });
	// hill3(tl, { x: edge - 500, y: 500 });


	// mountain(tl, edge, { x: 0, y: 0 });

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
