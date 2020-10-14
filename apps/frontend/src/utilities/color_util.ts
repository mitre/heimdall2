/**
 * Contains various functions for the manipulation of color.
 * Not written with an eye towards efficiency - prefer that these be done staitcally
 */

import {VuetifyParsedThemeItem} from 'vuetify/types/services/theme';
import Chroma from 'chroma-js';

/** Makes a color that is visible against the provided color */
export function visible_against(color_hex: string): string {
  // Get the color
  let color = Chroma.hex(color_hex);

  // Rotate 50 degrees in hue (arbitrary # but seems nice)
  color = color.set('hsl.h', '+180');

  // Now set its luminance to the opposite extreme
  let lum = color.luminance();
  if (lum < 0.5) {
    color = color.luminance(0.8);
  } else {
    color = color.luminance(0.03);
  }
  return color.hex();
}

/** Bounds luminance so it never quite reaches 0 or 1 */
function lum_sigmoid(t: number, shift: number) {
  // The base sigmoid maps [-infinity, infinity] to [0, 1]
  // return 1/(1+Math.pow(Math.E, -t));
  // First compute inverse sigmoid to find our starting place
  let logit_t = -Math.log(1 / t - 1);

  // Then shift in domain and recompute using sigmoid
  let shifted_logit = logit_t + shift;
  let shifted_sigmoid = 1 / (1 + Math.pow(Math.E, -shifted_logit));

  return shifted_sigmoid;
}

/** Shifts a colors luminance by the specified amount */
export function shift(base_color: string, amount: number): string {
  let c = Chroma.hex(base_color);
  let base_l = c.luminance();
  let new_l = lum_sigmoid(base_l, amount);
  let new_c = c.luminance(new_l);
  return new_c.hex();
}

/** Gen variations on a color */
const BASE_SPREAD = 0.5;
export function gen_variants(
  base_color: string,
  spread: number = 1.0
): VuetifyParsedThemeItem {
  // Re-scale
  spread = spread * BASE_SPREAD;

  return {
    darken4: shift(base_color, -4 * spread),
    darken3: shift(base_color, -3 * spread),
    darken2: shift(base_color, -2 * spread),
    darken1: shift(base_color, -1 * spread),
    base: base_color,
    lighten1: shift(base_color, 1 * spread),
    lighten2: shift(base_color, 2 * spread),
    lighten3: shift(base_color, 3 * spread),
    lighten4: shift(base_color, 4 * spread),
    lighten5: shift(base_color, 5 * spread)
  };
}

/** Replaces all colors in a VuetifyParsedThemeItem with
 * a variant that will be visible against the original color.
 */
export function gen_visibilities(
  colorset: VuetifyParsedThemeItem
): VuetifyParsedThemeItem {
  let c: VuetifyParsedThemeItem = {...colorset};
  Object.keys(c).forEach((key) => {
    c[key] = visible_against(c[key]!);
  });
  return c;
}
