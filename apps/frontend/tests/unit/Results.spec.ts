import ControlTable from '@/components/cards/controltable/ControlTable.vue';
import type {Filter} from '@/store/data_filters';
import { FilteredDataModule} from '@/store/data_filters';
import Results from '@/views/Results.vue';
import type { Wrapper} from '@vue/test-utils';
import {shallowMount} from '@vue/test-utils';
import type {ContextualizedControl} from 'inspecjs';
import {beforeEach, describe, expect, it} from 'vitest';
import type Vue from 'vue';
import Vuetify from 'vuetify';
import {
  expectedCount,
  loadAll,
  loadSample,
  removeAllFiles,
  DataLoadApproach
} from '../util/testing-utils';

interface ListElt {
  // A unique id to be used as a key.
  key: string;

  // Computed values for status and severity "value", for sorting
  status_val: number;
  severity_val: number;

  control: ContextualizedControl;
}

const $router = {
  currentRoute: {
    path: '/results'
  }
};
const vuetify = new Vuetify();

const wrapper: Wrapper<Vue> = shallowMount(Results, {
  vuetify,
  mocks: {
    $router
  },
  propsData: {}
});

// Sequential, like Compare: these tests share one store, and vitest is
// configured to run tests concurrently, so any await in a test body would
// otherwise let a sibling's loaded files appear in this one's assertions.
describe.sequential('Datatable', () => {
  beforeEach(() => {
    removeAllFiles();
  });

  it('displays correct number of controls with many files', async () => {
    await loadAll();
    const controlTableWrapper = shallowMount(ControlTable, {
      vuetify,
      mocks: {
        $router
      },
      propsData: {
        filter: (wrapper.vm as Vue & {all_filter: Filter}).all_filter
      }
    });
    const expected =
      expectedCount('passed') +
      expectedCount('failed') +
      expectedCount('notReviewed') +
      expectedCount('notApplicable') +
      expectedCount('profileError');
    expect(
      (
        controlTableWrapper.vm as Vue & {
           
          items: any[];
        }
      ).items.length
    ).toBe(expected);
  });

  it('displays correct number of controls with many files generated from a single sample file while using the loadFile method', () => {
    // Deliberately not awaited, unlike its siblings. Awaiting it makes
    // expectedCount ask for per-file counts fixtures that do not exist for the
    // files this sample splits into, which exposes that the assertion below
    // currently compares zero against zero. Tracked as heimdall2-0tp, which
    // has to decide what this test should assert before it can be awaited.
    void loadSample('Conveyor Sample', DataLoadApproach.File);
    const controlTableWrapper = shallowMount(ControlTable, {
      vuetify,
      mocks: {
        $router
      },
      propsData: {
        filter: (wrapper.vm as Vue & {all_filter: Filter}).all_filter
      }
    });
    const expected =
      expectedCount('passed') +
      expectedCount('failed') +
      expectedCount('notReviewed') +
      expectedCount('notApplicable') +
      expectedCount('profileError');
    expect(
      (
        controlTableWrapper.vm as Vue & {
           
          items: any[];
        }
      ).items.length
    ).toBe(expected);
  });

  it('control row and table data is correct', async () => {
    await loadAll();
    const controlTableWrapper = shallowMount(ControlTable, {
      vuetify,
      mocks: {
        $router
      },
      propsData: {
        filter: (wrapper.vm as Vue & {all_filter: Filter}).all_filter
      }
    });
    expect(
      (
        controlTableWrapper.vm as Vue & {
           
          items: any[];
        }
      ).items
        .map((item: ListElt) => item.control.data.id)
        .toSorted((a, b) => a.localeCompare(b))
    ).toEqual(
      FilteredDataModule.controls({
        fromFile: FilteredDataModule.selected_file_ids,
        omit_overlayed_controls: true
      })
        .map((c) => c.data.id)
        .toSorted((a, b) => a.localeCompare(b))
    );
  });

  it('it can properly filter overridden results', async () => {
    await loadSample('Small Profile With Severity Overrides');
    const controlTableWrapper = shallowMount(ControlTable, {
      vuetify,
      mocks: {
        $router
      },
      propsData: {
        filter: {
          ...(wrapper.vm as Vue & {all_filter: Filter}).all_filter,
          tagFilter: ['severityoverride']
        }
      }
    });

    expect(
      (
        controlTableWrapper.vm as Vue & {
           
          items: any[];
        }
      ).items.length
    ).toBe(3); // the file loaded includes 3 controls with severity override tags
  });
});
