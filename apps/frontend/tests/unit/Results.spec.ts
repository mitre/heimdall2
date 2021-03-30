import ControlTable from '@/components/cards/controltable/ControlTable.vue';
import ProfData from '@/components/cards/ProfileData.vue';
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {profile_unique_key} from '@/utilities/format_util';
import Results from '@/views/Results.vue';
import {shallowMount, Wrapper} from '@vue/test-utils';
import {context} from 'inspecjs';
import 'jest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {FileID} from '../../src/store/report_intake';
import {
  expectedCount,
  loadAll,
  loadSample,
  removeAllFiles
} from '../util/testingUtils';

interface ListElt {
  // A unique id to be used as a key.
  key: string;

  // Computed values for status and severity "value", for sorting
  status_val: number;
  severity_val: number;

  control: context.ContextualizedControl;
}

interface InfoItem {
  label: string;
  text: string;
  info?: string;
}

const $router = {
  currentRoute: {
    path: '/results'
  }
};
const vuetify = new Vuetify();
let profInfoWrapper: Wrapper<Vue>;
let controlTableWrapper: Wrapper<Vue>;

const wrapper: Wrapper<Vue> = shallowMount(Results, {
  vuetify,
  mocks: {
    $router
  },
  propsData: {}
});

loadSample('Acme Overlay Example');

describe('Datatable', () => {
  it('displays correct number of controls with many files', () => {
    removeAllFiles();
    loadAll();
    controlTableWrapper = shallowMount(ControlTable, {
      vuetify,
      mocks: {
        $router
      },
      propsData: {
        filter: (wrapper.vm as Vue & {all_filter: Filter}).all_filter,
        showImpact: true
      }
    });
    const expected =
      expectedCount('passed') +
      expectedCount('failed') +
      expectedCount('notReviewed') +
      expectedCount('notApplicable') +
      expectedCount('profileError');
    expect(
      (controlTableWrapper.vm as Vue & {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: Array<any>;
      }).items.length
    ).toBe(expected);
  });

  it('control row and table data is correct', () => {
    expect(
      (controlTableWrapper.vm as Vue & {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: Array<any>;
      }).items
        .map((item: ListElt) => item.control.data.id)
        .sort()
    ).toEqual(
      FilteredDataModule.controls({
        fromFile: FilteredDataModule.selected_file_ids,
        omit_overlayed_controls: true
      })
        .map((c) => c.data.id)
        .sort()
    );
  });
});
