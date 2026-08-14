import ExportJson from '@/components/global/ExportJson.vue';
import type {Wrapper} from '@vue/test-utils';
import {shallowMount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';
import type Vue from 'vue';
import Vuetify from 'vuetify';
import {addElemWithDataAppToBody} from '../util/testing-utils';

addElemWithDataAppToBody();

describe('ExportJson filenames', () => {
  const vuetify = new Vuetify();
  const wrapper: Wrapper<Vue> = shallowMount(ExportJson, {vuetify});
  const cleanup = (filename: string): string =>
    (
      wrapper.vm as Vue & {cleanup_filename(filename: string): string}
    ).cleanup_filename(filename);

  // The old check compared the last SIX characters against the five-character
  // '.json', so it could never match and every export gained a second
  // extension.
  it('leaves a name that already ends in .json alone', () => {
    expect(cleanup('results.json')).toBe('results.json');
  });

  it('adds the extension to a name that lacks it', () => {
    expect(cleanup('results')).toBe('results.json');
  });

  it('replaces whitespace runs with underscores', () => {
    expect(cleanup('my results file')).toBe('my_results_file.json');
  });
});
