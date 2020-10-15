import {Module, VuexModule, getModule} from 'vuex-module-decorators';
import Store from '@/store/store';
import {nist} from 'inspecjs';

/**
 * Gets a hex code for the given color
 * Code from:
 * https://stackoverflow.com/a/24366628
 */
function calculateColor(colorName: string): string {
  // Create our dummy element
  let elt: HTMLDivElement = document.createElement('div');
  elt.style.color = colorName;

  // Add it to the doc and get the resulting style
  let style = window.getComputedStyle(document.body.appendChild(elt));

  // Parse out the colors
  let rawColors = (style.color as string).match(/\d+/g) as RegExpExecArray; // We know this will succeed - we've already given the colors
  let colors = rawColors.map((a: string) => parseInt(a, 10));

  // Cleanup
  document.body.removeChild(elt);
  if (colors.length >= 3) {
    // Make a (padded) integer representing the hex code
    let value = (1 << 24) + (colors[0] << 16) + (colors[1] << 8) + colors[2];
    // Parse it as hex, and replace the leading 1 with a #
    let value_string = '#' + value.toString(16).substr(1);
    return value_string;
  } else {
    throw new Error(`Error generating color ${colorName}`);
  }
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'colorHack'
})
export class ColorHack extends VuexModule {
  /**
   * Get a color's (e.g. red, blue, info, error) hex code by name.
   * Tries a class color before a base/builtin color
   */
  get lookupColor(): (colorName: string) => string {
    // Establish a cache
    const localCache: {[key: string]: string} = {};

    // Establish to vue that we vary on any changes to the theme
    // let _depends: any = this.
    return (colorName: string) => {
      // Check if we have this cached:
      if (colorName in localCache) {
        return localCache[colorName];
      } else {
        // If not calculate it
        // We first try class colors, assuming base.
        let color = calculateColor(`var(--v-${colorName}-base)`);

        // Failing that, we try class colors but without assuming base (in case they did info-darken or something)
        if (color === '#000000') {
          color = calculateColor(`var(--v-${colorName}`);
        }

        // Then we fall back to non-class builtins
        if (color === '#000000') {
          color = calculateColor(colorName);
        }

        localCache[colorName] = color;
        return color;
      }
    };
  }

  /**
   * Parameterized getter that returns an appropriate rgb color code for a given control (group) status
   */
  get colorForStatus(): (status: nist.ControlGroupStatus) => string {
    return (status: nist.ControlGroupStatus) => {
      switch (status) {
        case 'Passed':
          return this.lookupColor('statusPassed');
        case 'Failed':
          return this.lookupColor('statusFailed');
        case 'Not Applicable':
          return this.lookupColor('statusNotApplicable');
        case 'Not Reviewed':
          return this.lookupColor('statusNotReviewed');
        case 'Profile Error':
          return this.lookupColor('statusProfileError');
        case 'From Profile':
          return this.lookupColor('statusFromProfile');
        case 'Empty':
          return 'black';
        default:
          console.warn(`No color defined for ${status}`);
          return 'rgb(187, 187, 187)';
      }
    };
  }
}
export const ColorHackModule = getModule(ColorHack);
