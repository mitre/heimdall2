import type { Wrapper } from '@vue/test-utils';
import { shallowMount } from '@vue/test-utils';
import type { ContextualizedControl } from 'inspecjs';
import { beforeEach, describe, expect, it } from 'vitest';
import type Vue from 'vue';
import Vuetify from 'vuetify';
import ControlTable from '@/components/cards/controltable/ControlTable.vue';
import type { Filter } from '@/store/data_filters';
import { FilteredDataModule } from '@/store/data_filters';
import Results from '@/views/Results.vue';
import {
  DataLoadApproach,
  expectedCount,
  loadAll,
  loadSample,
  removeAllFiles,
} from '../util/testingUtils';

type ListElt = {
  control: ContextualizedControl;

  // A unique id to be used as a key.
  key: string;
  severity_val: number;

  // Computed values for status and severity "value", for sorting
  status_val: number;
};

const $router = { currentRoute: { path: '/results' } };
const vuetify = new Vuetify();
let controlTableWrapper: Wrapper<Vue>;

const wrapper: Wrapper<Vue> = shallowMount(Results, {
  mocks: { $router },
  propsData: {},
  vuetify,
});

describe('Datatable', () => {
  beforeEach(() => {
    removeAllFiles();
  });

  it('displays correct number of controls with many files', () => {
    loadAll();
    controlTableWrapper = shallowMount(ControlTable, {
      mocks: { $router },
      propsData: { filter: (wrapper.vm as Vue & { all_filter: Filter }).all_filter },
      vuetify,
    });
    const expected
      = expectedCount('passed')
        + expectedCount('failed')
        + expectedCount('notReviewed')
        + expectedCount('notApplicable')
        + expectedCount('profileError');
    expect(
      (
        controlTableWrapper.vm as Vue & { items: any[] }
      ).items.length,
    ).toBe(expected);
  });

  it('displays correct number of controls with many files generated from a single sample file while using the loadFile method', () => {
    loadSample('Conveyor Sample', DataLoadApproach.File);
    controlTableWrapper = shallowMount(ControlTable, {
      mocks: { $router },
      propsData: { filter: (wrapper.vm as Vue & { all_filter: Filter }).all_filter },
      vuetify,
    });
    const expected
      = expectedCount('passed')
        + expectedCount('failed')
        + expectedCount('notReviewed')
        + expectedCount('notApplicable')
        + expectedCount('profileError');
    expect(
      (
        controlTableWrapper.vm as Vue & { items: any[] }
      ).items.length,
    ).toBe(expected);
  });

  it('control row and table data is correct', () => {
    loadAll();
    controlTableWrapper = shallowMount(ControlTable, {
      mocks: { $router },
      propsData: { filter: (wrapper.vm as Vue & { all_filter: Filter }).all_filter },
      vuetify,
    });
    expect(
      (
        controlTableWrapper.vm as Vue & { items: any[] }
      ).items
        .map((item: ListElt) => item.control.data.id)
        .sort(),
    ).toEqual(
      FilteredDataModule.controls({
        fromFile: FilteredDataModule.selected_file_ids,
        omit_overlayed_controls: true,
      })
        .map(c => c.data.id)
        .sort(),
    );
  });

  it('can properly filter overridden results', () => {
    loadSample('Small Profile With Severity Overrides');
    controlTableWrapper = shallowMount(ControlTable, {
      mocks: { $router },
      propsData: {
        filter: {
          ...(wrapper.vm as Vue & { all_filter: Filter }).all_filter,
          tagFilter: ['severityoverride'],
        },
      },
      vuetify,
    });

    expect(
      (
        controlTableWrapper.vm as Vue & { items: any[] }
      ).items.length,
    ).toBe(3); // the file loaded includes 3 controls with severity override tags
  });
});
