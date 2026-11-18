// The glyphs drawn on the profile (spec 0004): section heading icons, the solved check, and the level shield.
// Path data only, on a 24 × 24 grid: no color, no fill, no transform, one path per icon, so one color class paints
// it. All are hand drawn; holes are cut by drawing them in the opposite direction. Brand logos are whole full
// color files in src/brands.ts (spec 0010), and `IconName` covers both, so a section draws either through `iconSvg`.

import { type BrandName, brands } from "./brands.ts";

export type Icon = {
  readonly path: string;
  /** Always `hand drawn`. */
  readonly source: string;
};

const HAND_DRAWN = "hand drawn";

/** Plain names for each glyph. */
export const icons = {
  award: {
    // A medal: a ring with its center cut out, over two ribbon tails.
    source: HAND_DRAWN,
    path: "M12 2A7 7 0 1 1 12 16A7 7 0 1 1 12 2ZM12 5A4 4 0 1 0 12 13A4 4 0 1 0 12 5ZM12 16.8L11 24L9.2 21.3L6 22.5L8.5 15ZM15.5 15L18 22.5L14.8 21.3L13 24L12 16.8Z",
  },
  briefcase: {
    // A briefcase with its handle on top and a band across the middle cut out.
    source: HAND_DRAWN,
    path: "M8 7V4.5C8 3.7 8.7 3 9.5 3H14.5C15.3 3 16 3.7 16 4.5V7H14.2V4.8H9.8V7ZM3.5 7H20.5C21.3 7 22 7.7 22 8.5V18.5C22 19.9 20.9 21 19.5 21H4.5C3.1 21 2 19.9 2 18.5V8.5C2 7.7 2.7 7 3.5 7ZM2 12.2V13.6H22V12.2Z",
  },
  check: {
    // A check mark as one filled stroke.
    source: HAND_DRAWN,
    path: "M20.3 5.3L9 16.6L3.7 11.3L2.3 12.7L9 19.4L21.7 6.7Z",
  },
  code: {
    // Angle brackets around a slash, as in </>.
    source: HAND_DRAWN,
    path: "M8.6 6.6L10 8L6 12L10 16L8.6 17.4L3.2 12ZM15.4 6.6L20.8 12L15.4 17.4L14 16L18 12L14 8ZM13.2 4.5L15 5L10.8 19.5L9 19Z",
  },
  graduationcap: {
    // A mortarboard: the flat top as a diamond, the cap below it, and a tassel on the right.
    source: HAND_DRAWN,
    path: "M12 3L23 8.5L12 14L1 8.5ZM5 11.5V16C5 17.7 8.1 19.5 12 19.5S19 17.7 19 16V11.5L12 15ZM20.5 9.5H21.5V15H20.5Z",
  },
  person: {
    // A head and shoulders.
    source: HAND_DRAWN,
    path: "M12 2.5A4.5 4.5 0 1 1 12 11.5A4.5 4.5 0 1 1 12 2.5ZM3.5 21.5C3.5 16.8 7.3 13.5 12 13.5S20.5 16.8 20.5 21.5Z",
  },
  shield: {
    // A shield outline, with the inner shield drawn in the opposite direction to cut it out.
    source: HAND_DRAWN,
    path: "M12 1L3 5V11C3 16.5 6.8 21.7 12 23C17.2 21.7 21 16.5 21 11V5ZM12 3.2L19 6.3V11C19 15.4 16.1 19.6 12 20.9C7.9 19.6 5 15.4 5 11V6.3Z",
  },
} as const satisfies { readonly [name: string]: Icon };

export type GlyphName = keyof typeof icons;
export type IconName = GlyphName | BrandName;

/** True for a brand logo from src/brands.ts, false for a glyph. `Object.hasOwn`, so `toString` never passes. */
export function isBrand(name: string): name is BrandName {
  return Object.hasOwn(brands, name);
}

/** True for any key of either registry. */
export function isIconName(name: string): name is IconName {
  return isBrand(name) || Object.hasOwn(icons, name);
}
