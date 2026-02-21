import {FilteredDataModule} from '@/store/data_filters';
import {SearchModule} from '@/store/search';
import {calculateCompliance, StatusCountModule} from '@/store/status_counts';
import {ComparisonContext, ControlSeries} from '@/utilities/delta_util';
import Compare from '@/views/Compare.vue';
import {shallowMount, Wrapper} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {loadSample, removeAllFiles} from '../util/testingUtils';

const vuetify = new Vuetify();
const wrapper: Wrapper<Vue> = shallowMount(Compare, {vuetify, propsData: {}});

export interface SeriesItem {
  name: string;
  data: number[];
}

const redHatControlCount = 247;
const nginxControlCount = 41;
const nginxDelta = 3;

describe('Compare table data', async () => {
  beforeEach(async () => {
    removeAllFiles();

    SearchModule.updateSearch('');

    await loadSample('NGINX With Failing Tests');
  });

  it('correctly counts controls with 1 file', () => {
    (wrapper.vm as Vue & {changedOnly: boolean}).changedOnly = false;
    expect(
      (wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets
        .length
    ).toBe(nginxControlCount);
  });

  it('does not recount same controls with 2 files', async () => {
    await loadSample('NGINX With Failing Tests');
    expect(
      (wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets
        .length
    ).toBe(nginxControlCount);
  });

  it('does not recount same controls with 3 files', async () => {
    await loadSample('NGINX With Failing Tests');
    await loadSample('NGINX With Failing Tests');
    expect(
      (wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets
        .length
    ).toBe(nginxControlCount);
  });

  it('does not show any changed between two of the same', async () => {
    await loadSample('NGINX With Failing Tests');
    (wrapper.vm as Vue & {changedOnly: boolean}).changedOnly = true;
    expect(
      (wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets
        .length
    ).toBe(0);
  });

  it('search works when nothing fits criteria', () => {
    (wrapper.vm as Vue & {searchTerm: string}).searchTerm = 'failed';
    SearchModule.parseSearch();
    expect(
      (wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets
        .length
    ).toBe(0);
  });

  it('search id works', async () => {
    await wrapper.setData({ changedOnly: false});
    SearchModule.updateSearch('v-13613');
    SearchModule.parseSearch();
    await Vue.nextTick();
    expect((wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets.length).toBe(1);
  });

  it('shows differing delta data when "show only changed"', async () => {
    await loadSample('NGINX Clean Sample');
    (wrapper.vm as Vue & {searchTerm: string}).searchTerm = '';
    (wrapper.vm as Vue & {changedOnly: boolean}).changedOnly = true;
    SearchModule.parseSearch();
    expect(
      (wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets
        .length
    ).toBe(nginxDelta);
  });

  it('search status works', async () => {
    await loadSample('NGINX Clean Sample');
    await wrapper.setData({ changedOnly: false});
    SearchModule.updateSearch('failed');
    SearchModule.parseSearch();
    await Vue.nextTick();
    expect((wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets.length).toBe(nginxDelta);
  });

  it('counts every unique control', async () => {
    await loadSample('NGINX Clean Sample');
    await loadSample('Red Hat With Failing Tests');
    (wrapper.vm as Vue & {searchTerm: string}).searchTerm = '';
    (wrapper.vm as Vue & {changedOnly: boolean}).changedOnly = true;
    SearchModule.parseSearch();
    expect(
      (wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets
        .length
    ).toBe(nginxControlCount + redHatControlCount);
  });

  it('shows all delta data of controls with multiple occurances when "show only changed"', async () => {
    await loadSample('NGINX Clean Sample');
    await loadSample('Red Hat With Failing Tests');
    await loadSample('Red Hat Clean Sample');
    expect(
      (wrapper.vm as Vue & {show_sets: [string, ControlSeries][]}).show_sets
        .length
    ).toBe(nginxControlCount + redHatControlCount);
  });

  it('ComparisonContext counts status correctly', async () => {
    await loadSample('NGINX Clean Sample');
    await loadSample('Red Hat With Failing Tests');
    await loadSample('Red Hat Clean Sample');
    let failed = 0;
    let passed = 0;
    let na = 0;
    let nr = 0;
    let pe = 0;
    const selectedData = FilteredDataModule.evaluations(
      FilteredDataModule.selected_file_ids
    );
    const currDelta = new ComparisonContext(selectedData);
    for (const pairing of Object.values(currDelta.pairings)) {
      for (const ctrl of Object.values(pairing)) {
        if (ctrl === null) {
          continue;
        } else if (ctrl.root.hdf.status === 'Passed') {
          passed++;
        } else if (ctrl.root.hdf.status === 'Failed') {
          failed++;
        } else if (ctrl.root.hdf.status === 'Not Applicable') {
          na++;
        } else if (ctrl.root.hdf.status === 'Not Reviewed') {
          nr++;
        } else if (ctrl.root.hdf.status === 'Profile Error') {
          pe++;
        }
      }
    }
    const expected = {
      Failed: StatusCountModule.hash({
        omit_overlayed_controls: true,
        fromFile: [...FilteredDataModule.selected_file_ids]
      }).Failed,
      Passed: StatusCountModule.hash({
        omit_overlayed_controls: true,
        fromFile: [...FilteredDataModule.selected_file_ids]
      }).Passed,
      'From Profile': 0,
      'Profile Error': StatusCountModule.hash({
        omit_overlayed_controls: true,
        fromFile: [...FilteredDataModule.selected_file_ids]
      })['Profile Error'],
      'Not Reviewed': StatusCountModule.hash({
        omit_overlayed_controls: true,
        fromFile: [...FilteredDataModule.selected_file_ids]
      })['Not Reviewed'],
      'Not Applicable': StatusCountModule.hash({
        omit_overlayed_controls: true,
        fromFile: [...FilteredDataModule.selected_file_ids]
      })['Not Applicable']
    };
    const actual = {
      Failed: failed,
      Passed: passed,
      'From Profile': 0,
      'Profile Error': pe,
      'Not Reviewed': nr,
      'Not Applicable': na
    };
    expect(actual).toEqual(expected);
  });
});

describe('compare charts', () => {
  beforeEach(() => {
    removeAllFiles();
  });

  it('sev chart gets correct data with 2 files', async () => {
    await loadSample('NGINX With Failing Tests');
    await loadSample('NGINX Clean Sample');
    //the values in expected are the correct data
    expect((wrapper.vm as Vue & {sev_series: number[][]}).sev_series).toEqual([
      [0, 0],
      [3, 0],
      [0, 0],
      [0, 0]
    ]);
  });

  it('sev chart gets correct data with 2 files with differing profiles', async () => {
    await loadSample('NGINX With Failing Tests');
    await loadSample('Red Hat With Failing Tests');
    //the values in expected are the correct data
    expect((wrapper.vm as Vue & {sev_series: number[][]}).sev_series).toEqual([
      [0, 6],
      [3, 18],
      [0, 3],
      [0, 0]
    ]);
  });

  it('sev chart gets correct data with 2 files with overlayed profiles', async () => {
    await loadSample('Three Layer RHEL7 Overlay Example');
    await loadSample('Acme Overlay Example');
    //the values in expected are the correct data
    expect((wrapper.vm as Vue & {sev_series: number[][]}).sev_series).toEqual([
      [0, 8],
      [0, 126],
      [0, 4],
      [60, 0]
    ]);
  });

  it('compliance chart gets correct data with 2 files', async () => {
    await loadSample('NGINX With Failing Tests');
    await loadSample('NGINX Clean Sample');
    expect(
      new Set(
        (
          wrapper.vm as Vue & {
            compliance_series: SeriesItem[];
          }
        ).compliance_series[0].data
      )
    ).toEqual(
      new Set([
        calculateCompliance({
          fromFile: [FilteredDataModule.selected_file_ids[0]]
        }),
        calculateCompliance({
          fromFile: [FilteredDataModule.selected_file_ids[1]]
        })
      ])
    );
  });

  it('compliance chart gets correct data with 2 files with differing profiles', async () => {
    await loadSample('NGINX With Failing Tests');
    await loadSample('Red Hat With Failing Tests');
    expect(
      new Set(
        (
          wrapper.vm as Vue & {
            compliance_series: SeriesItem[];
          }
        ).compliance_series[0].data
      )
    ).toEqual(
      new Set([
        calculateCompliance({
          fromFile: [FilteredDataModule.selected_file_ids[0]]
        }),
        calculateCompliance({
          fromFile: [FilteredDataModule.selected_file_ids[1]]
        })
      ])
    );
  });

  it('compliance chart gets correct data with 2 files with overlayed profiles', async () => {
    await loadSample('Three Layer RHEL7 Overlay Example');
    await loadSample('Acme Overlay Example');
    expect(
      new Set(
        (
          wrapper.vm as Vue & {
            compliance_series: SeriesItem[];
          }
        ).compliance_series[0].data
      )
    ).toEqual(
      new Set([
        calculateCompliance({
          fromFile: [FilteredDataModule.selected_file_ids[0]]
        }),
        calculateCompliance({
          fromFile: [FilteredDataModule.selected_file_ids[1]]
        })
      ])
    );
  });
});
