export const MAUVE = {
	hex: "efb4ca",
	rgb: "rgb(239, 180, 202)"
};

export const FLAMINGO = {
	hex: "f2c7da",
	rgb: "rgb(242, 199, 218)"
};

export const DENIM = {
	hex: "9bb7cd",
	rgb: "rgb(155, 183, 205)"
};

export const SOFTSKY = {
	hex: "c9d6e9",
	rgb: "rgb(201, 214, 233)"
};

export const LAVENDER = {
	hex: "d9c4e5",
	rgb: "rgb(217, 196, 229)"
};

export const VANILLA = {
	hex: "efd9aa",
	rgb: "rgb(239, 217, 170)"
};

export const APRICOT = {
	hex: "efb993",
	rgb: "rgb(239, 185, 147)"
};

export const LILAC = {
	hex: "d8c2d7",
	rgb: "rgb(216, 194, 215)"
};

export const POLARSKY = {
	hex: "b3dae1",
	rgb: "rgb(179, 218, 225)"
};

export const PISTACHIO = {
	hex: "b1cfb7",
	rgb: "rgb(177, 207, 183)"
};

/* Helpers: the palette as canvas colour strings */

// Palette colour with transparency, e.g. rgba(PISTACHIO, 0.4)
export function rgba(colour, alpha) {
	const n = parseInt(colour.hex, 16);
	return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// Darker version of a palette colour for outlines: amount 0 = same, 1 = black
export function shade(colour, amount) {
	const n = parseInt(colour.hex, 16);
	const k = 1 - amount;
	return `rgb(${Math.round((n >> 16) * k)}, ${Math.round(((n >> 8) & 255) * k)}, ${Math.round((n & 255) * k)})`;
}
