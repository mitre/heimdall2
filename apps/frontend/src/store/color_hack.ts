import { Module, VuexModule, getModule } from "vuex-module-decorators";
import Store from "./store";

/**
 * Gets a hex code for the given color
 * Code from:
 * https://stackoverflow.com/a/24366628
 */
function calculateColor(colorName: string): string {
  // Create our dummy element
  let a: HTMLDivElement = document.createElement("div");
  a.style.color = colorName;

  // Add it to the doc and get the resulting style
  let style = window.getComputedStyle(document.body.appendChild(a));

  // Parse out the colors
  let rawColors = (style.color as string).match(/\d+/g) as RegExpExecArray; // We know this will succeed - we've already given the colors
  let colors = rawColors.map((a: string) => parseInt(a, 10));

  // Cleanup
  document.body.removeChild(a);
  if (colors.length >= 3) {
    // Make a (padded) integer representing the hex code
    let value = (1 << 24) + (colors[0] << 16) + (colors[1] << 8) + colors[2];
    // Parse it as hex, and replace the leading 1 with a #
    let value_string = "#" + value.toString(16).substr(1);
    return value_string;
  } else {
    throw `Error generating color ${colorName}`;
  }
}

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: "colorHack"
})
class ColorHackModule extends VuexModule {
  /**
   * Get a color's (e.g. red, blue, info, error) hex code by name.
   * Tries a class color before a base/builtin color
   */
  get lookupColor(): (colorName: string) => string {
    // Establish a cache
    const localCache: { [key: string]: string } = {};

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
        if (color === "#000000") {
          color = calculateColor(`var(--v-${colorName}`);
        }

        // Then we fall back to non-class builtins
        if (color === "#000000") {
          color = calculateColor(colorName);
        }

        localCache[colorName] = color;
        return color;
      }
    };
  }
}

export default ColorHackModule;
