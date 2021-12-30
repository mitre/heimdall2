/**
 * Contains various functions for the manipulation of color.
 * Not written with an eye towards efficiency - prefer that these be done statically
 */
import Chroma from 'chroma-js';
import {VuetifyParsedThemeItem} from 'vuetify/types/services/theme';

//
export const colorOnColorLookupTable: Record<string, string> = {
  '#005568': '#efe5e3',
  '#006981': '#f1e5e2',
  '#00809e': '#f3e4e0',
  '#0099bd': '#f7e3df',
  '#00b3dc': '#fae2dd',
  '#4dcae7': '#fae2dc',
  '#86dbee': '#fae2dd',
  '#afe7f4': '#3b2d2a',
  '#cbf0f8': '#372f2d',
  '#def5fa': '#342f2e',
  '#0d0d0d': '#e7e7e7',
  '#131313': '#e7e7e7',
  '#1b1b1b': '#e7e7e7',
  '#252525': '#e7e7e7',
  '#303030': '#e7e7e7',
  '#3e3e3e': '#e7e7e7',
  '#4e4e4e': '#e7e7e7',
  '#616161': '#e7e7e7',
  '#777777': '#e7e7e7',
  '#8e8e8e': '#e7e7e7'
};

export const colorShiftLookupTable: Record<string, string> = {
  '#005b94+-2': '#002237',
  '#005b94+-1.5': '#002d49',
  '#005b94+-1': '#00395d',
  '#005b94+-0.5': '#004976',
  '#005b94+0.5': '#2372a3',
  '#005b94+1': '#4789b2',
  '#005b94+1.5': '#6ca0c1',
  '#005b94+2': '#8eb7d0',
  '#005b94+2.5': '#adcadd',
  '#5f636a+-2': '#242528',
  '#5f636a+-1.5': '#2f3135',
  '#5f636a+-1': '#3d3f44',
  '#5f636a+-0.5': '#4c5055',
  '#5f636a+0.5': '#75797f',
  '#5f636a+1': '#8d9095',
  '#5f636a+1.5': '#a5a8ab',
  '#5f636a+2': '#bcbec0',
  '#5f636a+2.5': '#cfd0d3',
  '#cfdeea+-2': '#828b93',
  '#cfdeea+-1.5': '#98a3ac',
  '#cfdeea+-1': '#adbac4',
  '#cfdeea+-0.5': '#c0ced9',
  '#cfdeea+0.5': '#dfe9f1',
  '#cfdeea+1': '#ebf1f6',
  '#cfdeea+1.5': '#f2f6f9',
  '#cfdeea+2': '#f7fafc',
  '#cfdeea+2.5': '#fafcfd',
  '#00b3dc+-2': '#005568',
  '#00b3dc+-1.5': '#006981',
  '#00b3dc+-1': '#00809e',
  '#00b3dc+-0.5': '#0099bd',
  '#00b3dc+0.5': '#4dcae7',
  '#00b3dc+1': '#86dbee',
  '#00b3dc+1.5': '#afe7f4',
  '#00b3dc+2': '#cbf0f8',
  '#00b3dc+2.5': '#def5fa',
  '#303030+-2': '#0d0d0d',
  '#303030+-1.5': '#131313',
  '#303030+-1': '#1b1b1b',
  '#303030+-0.5': '#252525',
  '#303030+0.5': '#3e3e3e',
  '#303030+1': '#4e4e4e',
  '#303030+1.5': '#616161',
  '#303030+2': '#777777',
  '#303030+2.5': '#8e8e8e'
};

/** Makes a color that is visible against the provided color */
export function visible_against(colorHex: string): string {
  // Somehow, chroma-js does not always import properly. This is not a good solution, but it works in the meantime.
  // https://github.com/mitre/heimdall2/issues/2350
  if (typeof Chroma !== 'undefined') {
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
  } else {
    return colorOnColorLookupTable[colorHex] || '#000000';
  }
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
  if (typeof Chroma !== 'undefined') {
    const c = Chroma.hex(baseColor);
    const baseL = c.luminance();
    const newL = lum_sigmoid(baseL, amount);
    const newC = c.luminance(newL);
    return newC.hex();
  } else {
    return colorShiftLookupTable[`${baseColor}+${amount}`];
  }
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
