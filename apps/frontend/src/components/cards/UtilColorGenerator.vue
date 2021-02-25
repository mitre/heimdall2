<template>
  <v-form>
    <v-text-field v-model="color" />
    <p>{{ body }}</p>
  </v-form>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {ColorHack, ColorHackModule} from '@/store/color_hack';
import {Color} from 'vuetify/lib/util/colors';

/**
 * Categories property must be of type Category
 * Model is of type Severity | null - reflects selected severity
 */
@Component
export default class UtilColorGenerator extends Vue {
  color: string = 'background';

  get body(): string {
    let color = colorVariants(ColorHackModule, this.color);
    let br = '\n';
    let rows = Object.keys(color)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((key) => `\t${key}: "${(color as any)[key]}"`)
      .join(`,${br}`);
    let output = `{${br}${rows}${br}}`;
    return output;
  }
}

/**
 * Outputs all of the variants of a theme color
 */
function colorVariants(cmod: ColorHack, base: string): Color {
  // List all of our suffixes
  let suffixes: Array<keyof Color> = [
    'darken4',
    'darken3',
    'darken2',
    'darken1',
    'base',
    'lighten1',
    'lighten2',
    'lighten3',
    'lighten4',
    'lighten5',
    'accent1',
    'accent2',
    'accent3',
    'accent4'
  ];

  // Generate
  // l cannot be typed Color as all fields in vuetify are typed as readonly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let l: Record<string, any> = {};
  suffixes.forEach((suffix) => {
    let full_name: string = `var(--v-${base}-${suffix})`;
    let color = cmod.lookupColor(full_name);
    l[suffix] = color;
  });
  return l as Color;
}
</script>
