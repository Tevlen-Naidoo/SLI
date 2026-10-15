import { Stage, Timeline, Ease, keyframes, progress } from './framework.js';
import { sun, hill1, betterHill1, hill2, hill3, mountain, flower1, flower2, flower3, distantHills, detailedMountain, meadow, hillPath, grass } from './objects.js';
import { seededRandom } from './utilities.js';
import { FLAMINGO, APRICOT, VANILLA } from './colours.js';
import { message } from './message.js';
import { SCRIPT } from './script.js';

const DEBUG = false; // true = show the coordinate grid and design area outline

// How much the scene is faded behind the message: 0 = not at all, 1 = white.
// Strongest in the middle, where the text is, easing off towards the edges.
const MUTE = { centre: 0.55, edges: 0.3, fadeIn: 3 }; // fadeIn: seconds to ease in after the prompt is answered

// How slowly the scene is drawn: 1 = the timings written in buildScene, 2.5 = two and a half times as long.
// The message types at its own speed; the grass breeze and the sun's spin keep their natural pace.
const SLOW = 4;

// Song volume once it has faded in (0..1), and how long the fade takes
const SONG_VOLUME = 0.05;
const SONG_FADE_IN = 4;

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

	// Everything in the scene plays slowed down by SLOW, as if drawn by hand in real time
	tl.layer({ speed: 1 / SLOW }, scene => {

		// The sun rises from behind the hills and settles just behind the peak (at y -315),
		// turning slowly the whole time.
		sun(scene, {
			x: 0,
			y: keyframes([[0, 260], [6, -300]], Ease.outCubic),  // [seconds, y]: start low, ease to a stop
			rotation: t => t * 0.12 * SLOW,                       // about one turn a minute, in real time
			scale: 0.4,
			at: sunAt,
		});

		detailedMountain(scene, { x: 0, y: 150, at: mountainAt });

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

		distantHills(scene, edge, bottom, {
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
	});

	// Soft white wash over the whole scene, so the message reads clearly on top
	tl.clip((ctx, t) => {
		ctx.globalAlpha *= progress(t, 0, MUTE.fadeIn, Ease.inOutSine); // eases in, rather than snapping on
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

/* ==========================================================================
   Sky
   A sunset: flamingo pink overhead, warming through apricot to vanilla at
   the horizon (just behind the hills). Drawn in scene units, so the
   horizon always lines up with the hills, whatever the screen shape.
   ========================================================================== */

function drawSky(ctx) {
	const { halfW, halfH } = stage;
	const sky = ctx.createLinearGradient(0, -450, 0, 120);
	sky.addColorStop(0, FLAMINGO.rgb);
	sky.addColorStop(0.55, APRICOT.rgb);
	sky.addColorStop(1, VANILLA.rgb);
	ctx.fillStyle = sky;
	ctx.fillRect(-halfW, -halfH, halfW * 2, halfH * 2);
}


/* ==========================================================================
   Start
   Browsers only allow sound after the visitor interacts with the page, so
   the scene waits behind a "Ready?" prompt. Either answer hides it, starts
   the song (faded in softly) and starts the animation.
   ========================================================================== */

const intro = document.getElementById('intro');
const song = document.getElementById('song');
let started = false;

function playSong() {
	// Volume goes through Web Audio: iPhones ignore audio.volume, but not this
	try {
		const AudioContext = window.AudioContext || window.webkitAudioContext;
		const audio = new AudioContext();
		const gain = audio.createGain();
		gain.gain.setValueAtTime(0, audio.currentTime);
		gain.gain.linearRampToValueAtTime(SONG_VOLUME, audio.currentTime + SONG_FADE_IN);
		audio.createMediaElementSource(song).connect(gain).connect(audio.destination);
		audio.resume();
	} catch {
		song.volume = SONG_VOLUME;
	}
	song.play().catch(() => { /* no sound allowed (e.g. no click yet); the animation still runs */ });
}

function begin() {
	if (started) return;
	started = true;
	intro.classList.add('hidden');
	playSong();
	stage.restart();
	stage.resume();
}

for (const button of intro.querySelectorAll('button')) button.addEventListener('click', begin);

// Jump straight to a moment while working on the scene, e.g. index.html?t=8 (skips the prompt, no sound)
const jumpTo = Number(new URLSearchParams(location.search).get('t'));
if (jumpTo) {
	begin();
	stage.seek(jumpTo);
}

stage.pause(); // until the prompt is answered (begin() resumes it)
if (started) stage.resume();

stage.start({
	draw(ctx, time) {
		drawSky(ctx);
		if (DEBUG) stage.drawGrid();
		if (started) timeline.draw(ctx, time);
		if (DEBUG) stage.drawDesignArea();
	},
});
