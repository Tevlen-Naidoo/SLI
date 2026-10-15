/* ==========================================================================
   Message
   The typewriter: types each line of the script, holds it, backspaces it,
   then moves on to the next. The last line stays up.

   It's a timeline item like any other, drawn on the same canvas as the
   scene, so it gets the same hand-drawn wobble from the stage.
   Everything is worked out from the time, so restart / seek just work.

   A line can be { text, question: true }: the typewriter types it and then
   holds it until answer() is called, before carrying on with the rest.

     const typewriter = message(tl, SCRIPT, { x: 0, y: -350, at: 0 })
   ========================================================================== */

import { unipolarSineWave } from './utilities.js';

export class Typewriter {
	/**
	 * @param {(string|{text: string, question?: boolean})[]} lines
	 *   one entry per message; "\n" splits a message over several lines
	 * @param {object} [opts]
	 */
	constructor(lines, opts = {}) {
		this.start = 0;                                      // set by the timeline
		this.lines = lines.map(line => (typeof line === 'string' ? { text: line } : line));
		this.question = this.lines.findIndex(line => line.question);  // -1 = none
		this.answeredAt = opts.answeredAt ?? null;           // local time the question was answered

		this.x = opts.x ?? 0;
		this.y = opts.y ?? 0;
		this.size = opts.size ?? 66;                         // font size in units (≈ 50pt on a 1600-wide screen)
		this.font = opts.font ?? "'Yuyu'";
		this.color = opts.color ?? '#000000';
		this.lineHeight = opts.lineHeight ?? 1.25;           // multiple of size
		this.maxWidth = opts.maxWidth ?? 1500;               // longer rows shrink the whole message to fit

		this.typingSpeed = opts.typingSpeed ?? 10;           // characters per second
		this.backspaceSpeed = opts.backspaceSpeed ?? 10;
		this.displayDuration = opts.displayDuration ?? 2;    // seconds a finished line is held
		this.transitionDuration = opts.transitionDuration ?? 0.5; // seconds of blank between lines
		this.answerPause = opts.answerPause ?? 1;            // seconds the question stays up after it's answered

		this._buildSchedule();
	}

	// When each message starts typing; the last one is held for good.
	// An unanswered question is held forever, so nothing after it starts yet.
	_buildSchedule() {
		this.schedule = [];
		let t = 0;
		for (const [i, { text }] of this.lines.entries()) {
			const typed = t + text.length / this.typingSpeed;
			let held = typed + this.displayDuration;
			if (i === this.question) {
				held = this.answeredAt == null ? Infinity : Math.max(typed, this.answeredAt) + this.answerPause;
			}
			const deleted = held + text.length / this.backspaceSpeed;
			this.schedule.push({ text, start: t, typed, held, deleted });
			if (i < this.lines.length - 1) t = deleted + this.transitionDuration;
		}

		const last = this.schedule[this.schedule.length - 1];
		this.duration = last && Number.isFinite(last.held) ? last.held : 0;
	}

	// True once the question is fully typed and still waiting for an answer
	waitingForAnswer(time) {
		if (this.question < 0 || this.answeredAt != null) return false;
		return time - this.start >= this.schedule[this.question].typed;
	}

	// Carries on with the rest of the messages (time = the timeline's time now)
	answer(time) {
		if (this.answeredAt != null) return;
		this.answeredAt = time - this.start;
		this._buildSchedule();
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

		ctx.save();

		// Shrink the whole message if its widest row (once fully typed) won't fit
		ctx.font = `${this.size}px ${this.font}`;
		const widest = Math.max(...text.split('\n').map(row => ctx.measureText(row).width));
		const size = this.size * Math.min(1, this.maxWidth / widest);
		ctx.font = `${size}px ${this.font}`;

		const step = size * this.lineHeight;
		const top = this.y - ((rows.length - 1) * step) / 2;

		ctx.fillStyle = this.color;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';

		for (const [i, row] of rows.entries()) {
			ctx.fillText(row, this.x, top + i * step);
		}

		// Blinking caret after the last row
		const lastRow = rows[rows.length - 1];
		const caretX = this.x + ctx.measureText(lastRow).width / 2 + size * 0.15;
		const caretY = top + (rows.length - 1) * step;
		const caretHeight = size * 0.95;

		ctx.globalAlpha *= unipolarSineWave(4 * t);
		ctx.fillRect(caretX, caretY - caretHeight / 2, size * 0.045, caretHeight);
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
