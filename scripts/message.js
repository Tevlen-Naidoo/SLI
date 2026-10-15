/* ==========================================================================
   Message
   The typewriter: types each line of the script, holds it, backspaces it,
   then moves on to the next. The last line stays up.

   It's a timeline item like any other, drawn on the same canvas as the
   scene, so it gets the same hand-drawn wobble from the stage.
   Everything is worked out from the time, so restart / seek just work.

     message(tl, SCRIPT, { x: 0, y: -350, at: 0 })
   ========================================================================== */

import { unipolarSineWave } from './utilities.js';

export class Typewriter {
	/**
	 * @param {string[]} lines  one entry per message; "\n" splits a message over several lines
	 * @param {object} [opts]
	 */
	constructor(lines, opts = {}) {
		this.start = 0;                                      // set by the timeline
		this.lines = lines;

		this.x = opts.x ?? 0;
		this.y = opts.y ?? 0;
		this.size = opts.size ?? 66;                         // font size in units (≈ 50pt on a 1600-wide screen)
		this.font = opts.font ?? "'Yuyu'";
		this.color = opts.color ?? '#000000';
		this.lineHeight = opts.lineHeight ?? 1.25;           // multiple of size

		this.typingSpeed = opts.typingSpeed ?? 10;           // characters per second
		this.backspaceSpeed = opts.backspaceSpeed ?? 10;
		this.displayDuration = opts.displayDuration ?? 2;    // seconds a finished line is held
		this.transitionDuration = opts.transitionDuration ?? 0.5; // seconds of blank between lines

		// When each message starts typing; the last one is held for good
		this.schedule = [];
		let t = 0;
		for (const [i, text] of lines.entries()) {
			const typed = t + text.length / this.typingSpeed;
			const held = typed + this.displayDuration;
			const deleted = held + text.length / this.backspaceSpeed;
			this.schedule.push({ text, start: t, typed, held, deleted });
			if (i < lines.length - 1) t = deleted + this.transitionDuration;
		}

		const last = this.schedule[this.schedule.length - 1];
		this.duration = last ? last.held : 0;
	}

	get end() {
		return this.start + this.duration;
	}

	// Which message is up at local time t, and how many of its characters are showing
	_state(t) {
		let entry = this.schedule[0];
		for (const e of this.schedule) {
			if (t >= e.start) entry = e;
		}

		const isLast = entry === this.schedule[this.schedule.length - 1];
		let shown;
		if (t < entry.typed) shown = Math.floor((t - entry.start) * this.typingSpeed);
		else if (t < entry.held || isLast) shown = entry.text.length;
		else shown = entry.text.length - Math.floor((t - entry.held) * this.backspaceSpeed);

		return { text: entry.text, shown: Math.max(0, Math.min(entry.text.length, shown)) };
	}

	draw(ctx, time) {
		if (time < this.start || !this.schedule.length) return;
		const t = time - this.start;

		const { text, shown } = this._state(t);
		const rows = text.substring(0, shown).split('\n');
		const step = this.size * this.lineHeight;
		const top = this.y - ((rows.length - 1) * step) / 2;

		ctx.save();
		ctx.font = `${this.size}px ${this.font}`;
		ctx.fillStyle = this.color;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		for (const [i, row] of rows.entries()) {
			ctx.fillText(row, this.x, top + i * step);
		}

		// Blinking caret after the last row
		const lastRow = rows[rows.length - 1];
		const caretX = this.x + ctx.measureText(lastRow).width / 2 + this.size * 0.15;
		const caretY = top + (rows.length - 1) * step;
		const caretHeight = this.size * 0.95;

		ctx.globalAlpha *= unipolarSineWave(4 * t);
		ctx.fillRect(caretX, caretY - caretHeight / 2, this.size * 0.045, caretHeight);
		ctx.restore();
	}
}

/**
 * Adds the typewriter to a timeline. Takes the usual scheduling options
 * (at, delay) as well as the Typewriter options.
 */
export function message(tl, lines, opts = {}) {
	return tl.place(new Typewriter(lines, opts), opts);
}
