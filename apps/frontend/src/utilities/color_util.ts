/**
 * Contains various functions for the manipulation of color.
 * Not written with an eye towards efficiency - prefer that these be done staitcally
 */

import Chroma from 'chroma-js';
import {VuetifyParsedThemeItem} from 'vuetify/types/services/theme';

/** Makes a color that is visible against the provided color */
export function visible_against(colorHex: string): string {
  // Get the color
  let color = Chroma.hex(colorHex);

  // Rotate 50 degrees in hue (arbitrary # but seems nice)
  color = color.set('hsl.h', '+180');

  // Now set its luminance to the opposite extreme
  const lum = color.luminance();
  if (lum < 0.5) {
    color = color.luminance(0.8);
  } else {
    color = color.luminance(0.03);
  }
  return color.hex();
}

/** Bounds luminance so it never quite reaches 0 or 1 */
function lum_sigmoid(t: number, move: number) {
  // The base sigmoid maps [-infinity, infinity] to [0, 1]
  // return 1/(1+Math.pow(Math.E, -t));
  // First compute inverse sigmoid to find our starting place
  const logitT = -Math.log(1 / t - 1);

  // Then move in domain and recompute using sigmoid
  const shiftedLogit = logitT + move;
  return 1 / (1 + Math.pow(Math.E, -shiftedLogit));
}

/** Shifts a colors luminance by the specified amount */
export function shift(baseColor: string, amount: number): string {
  const c = Chroma.hex(baseColor);
  const baseL = c.luminance();
  const newL = lum_sigmoid(baseL, amount);
  const newC = c.luminance(newL);
  return newC.hex();
}

/** Gen variations on a color */
const BASE_SPREAD = 0.5;
export function gen_variants(
  baseColor: string,
  spread = 1.0
): VuetifyParsedThemeItem {
  // Re-scale
  spread = spread * BASE_SPREAD;

  return {
    darken4: shift(baseColor, -4 * spread),
    darken3: shift(baseColor, -3 * spread),
    darken2: shift(baseColor, -2 * spread),
    darken1: shift(baseColor, -1 * spread),
    base: baseColor,
    lighten1: shift(baseColor, 1 * spread),
    lighten2: shift(baseColor, 2 * spread),
    lighten3: shift(baseColor, 3 * spread),
    lighten4: shift(baseColor, 4 * spread),
    lighten5: shift(baseColor, 5 * spread)
  };
}

/** Replaces all colors in a VuetifyParsedThemeItem with
 * a variant that will be visible against the original color.
 */
export function gen_visibilities(
  colorset: VuetifyParsedThemeItem
): VuetifyParsedThemeItem {
  const c: VuetifyParsedThemeItem = {...colorset};
  let key: keyof VuetifyParsedThemeItem;
  for (key in c) {
    c[key] = visible_against(c[key]);
  }
  return c;
}
