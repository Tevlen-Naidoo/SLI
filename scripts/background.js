import { Stage, Timeline, Ease, keyframes } from './framework.js';
import { sun, hill1, betterHill1, hill2, hill3, mountain, flower1, flower2, flower3, distantHills, detailedMountain, meadow, hillPath, grass } from './objects.js';
import { seededRandom } from './utilities.js';
import { message } from './message.js';
import { SCRIPT } from './script.js';

const DEBUG = true; // true = show the coordinate grid and design area outline

// How much the scene is faded behind the message: 0 = not at all, 1 = white.
// Strongest in the middle, where the text is, easing off towards the edges.
const MUTE = { centre: 0.55, edges: 0.3 };

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

	/* Choreography (seconds). Things are added back to front so they overlap
	   correctly, but each one gets an explicit start time, so the animation
	   runs front to back: hills (nearest first), path, mountain, flowers
	   (nearest first), then the sun. */
	const hillTime = 2.6;                     // each hill: 2s outline + 0.6s fill
	const pathAt = hillTime * 3;              // once all three hills are in
	const pathLeg = 1;                        // each hill's piece of path
	const mountainAt = pathAt + pathLeg * 3 + 0.5;
	const flowersAt = mountainAt + 6;         // the mountain takes about 6s
	const flowerLeg = 2;                      // each hill's flowers start over this long
	const sunAt = flowersAt + flowerLeg * 3 + 1;

	// The sun rises from behind the hills and settles just behind the peak (at y -315),
	// turning slowly the whole time.
	sun(tl, {
		x: 0,
		y: keyframes([[0, 260], [6, -300]], Ease.outCubic),  // [seconds, y]: start low, ease to a stop
		rotation: t => t * 0.12,                              // radians per second, about one turn a minute
		scale: 0.4,
		at: sunAt,
	});

	detailedMountain(tl, { x: 0, y: 150, at: mountainAt });

	// Further up the screen = further away = smaller. Change the seed for a different layout.
	const random = seededRandom(14);
	const perspective = y => 0.04 + 0.22 * Math.pow(Math.max(0, Math.min(1, y / 470)), 1.3);

	// Per hill, furthest first: flowers, grass, and the path's route over it
	const beds = [
		{ flowers: 26, grass: 70, depth: [8, 50] },    // far hill
		{ flowers: 20, grass: 55, depth: [10, 60] },   // middle hill
		{ flowers: 16, grass: 40, depth: [25, 170] },  // near hill, right down to the bottom of the screen
	];

	const path = hillPath([
		{ from: -30, to: 20, bend: -25 },   // far hill: ends at the foot of the mountain
		{ from: 80, to: -40, bend: 50 },
		{ from: 380, to: 130, bend: -110 }, // near hill: starts at the bottom of the screen
	], { bottom, halfWidth: y => 380 * perspective(y) });

	distantHills(tl, edge, bottom, {
		at: 0,
		startFor: i => (2 - i) * hillTime,  // nearest hill first
		duration: 2, fillDuration: 0.6,
		onHill: (s, hill, hills) => {
			const nearness = 2 - hill.index;  // 0 for the nearest hill
			const bed = { ...beds[hill.index], edge, perspective, random, avoid: path.avoid };

			// path first, so the flowers and grass know to keep off it
			path.draw(s, hill, hills, pathAt + nearness * pathLeg, pathLeg);

			grass(s, hill.surfaceAt, { ...bed, count: bed.grass, colour: hill.colour, at: hill.end });

			meadow(s, hill.surfaceAt, {
				...bed, count: bed.flowers,
				start: flowersAt + nearness * flowerLeg, spread: flowerLeg,
			});
		},
	});

	// Soft white wash over the whole scene, so the message reads clearly on top
	tl.clip(ctx => {
		const radius = Math.hypot(halfW, halfH);
		const wash = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
		wash.addColorStop(0, `rgba(255, 255, 255, ${MUTE.centre})`);
		wash.addColorStop(1, `rgba(255, 255, 255, ${MUTE.edges})`);
		ctx.fillStyle = wash;
		ctx.fillRect(-halfW, -halfH, halfW * 2, halfH * 2);
	}, { at: 0 });

	message(tl, SCRIPT, { x: 0, y: 0, at: 0 });

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
