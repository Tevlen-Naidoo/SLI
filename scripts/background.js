import { Stage, Timeline, Ease, keyframes } from './framework.js';
import { sun, hill1, betterHill1, hill2, hill3, mountain, flower1, flower2, flower3, distantHills, detailedMountain } from './objects.js';
import { message } from './message.js';
import { SCRIPT } from './script.js';

const DEBUG = true; // true = show the coordinate grid and design area outline

const stage = new Stage(document.getElementById('background'), {
	designWidth: 1600,
	designHeight: 900,

	// Hand-drawn wobble over everything (scene and message). false = off.
	// frequency: noise cells per CSS pixel, amplitude: max nudge in CSS pixels
	wobble: { frameCount: 4, boilRate: 6, frequency: 0.1, amplitude: 1.2, supersample: 2 },
});

let timeline = null;

/* ==========================================================================
   Scene
   (0, 0) is the screen centre. The 1600 x 900 design area (x -800..800,
   y -450..450) is always visible. halfW / halfH are the visible edges,
   slightly larger on screens that aren't exactly 16:9.
   ========================================================================== */

function buildScene({ halfW, halfH }) {
	const tl = new Timeline();
	const edge = halfW + 20;   // run slightly past the edge so line caps aren't visible
	const bottom = halfH + 20; // same, for shapes that fill down off the bottom


	// sun(tl, { x: 0, y: 0 });
	// hill1(tl, { x: -edge + 200, y: 500 });
	// betterHill1(tl, edge, { x: 0, y: 0 });
	// hill2(tl, { x: edge - 300, y: 500 });
	// hill3(tl, { x: edge - 500, y: 500 });


	// mountain(tl, edge, { x: 0, y: 0 });

	// flower1(tl, { x: 0, y: 400 });
	// flower2(tl, { x: 0, y: 400 }); // (x, y) = stalk base; add scale: 0.3 etc. to shrink

	// Back to front: sun, mountain, hills, flowers, then the message on top

	// The sun rises from behind the hills and settles just behind the peak (at y -315),
	// turning slowly the whole time. It waits for the hills to fill in so it's hidden as it starts.
	sun(tl, {
		x: 0,
		y: keyframes([[0, 260], [6, -300]], Ease.outCubic),  // [seconds, y]: start low, ease to a stop
		rotation: t => t * 0.12,                              // radians per second, about one turn a minute
		scale: 0.4,
		at: 4,
	});

	detailedMountain(tl, { x: 0, y: 150, at: 0 });
	distantHills(tl, edge, bottom, { at: 0.8 });

	flower1(tl, { x: -560, y: 450, scale: 0.45, at: 2.5 });
	flower2(tl, { x: -260, y: 460, scale: 0.35, at: 2.8 });
	flower3(tl, { x: 520, y: 450, scale: 0.55, at: 3 });

	message(tl, SCRIPT, { x: 0, y: -370, at: 0 });

	return tl;
}


/* ==========================================================================
   Run
   ========================================================================== */

stage.onResize = s => { timeline = buildScene(s); };
stage.onResize(stage);

stage.view.addEventListener('click', () => stage.restart());

// Jump straight to a moment while working on the scene, e.g. index.html?t=8
const jumpTo = Number(new URLSearchParams(location.search).get('t'));
if (jumpTo) stage.seek(jumpTo);

stage.start({
	draw(ctx, time) {
		if (DEBUG) stage.drawGrid();
		timeline.draw(ctx, time);
		if (DEBUG) stage.drawDesignArea();
	},
});
