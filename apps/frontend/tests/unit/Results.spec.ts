import 'jest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {shallowMount, Wrapper} from '@vue/test-utils';
import {FilteredDataModule} from '@/store/data_filters';

import {
  removeAllFiles,
  selectAllFiles,
  loadSample,
  loadAll,
  expectedCount
} from '../util/testingUtils';
import Results from '@/views/Results.vue';
import ProfData from '@/components/cards/ProfData.vue';
import {profile_unique_key} from '../../src/utilities/format_util';

import ControlTable from '../../src/components/cards/controltable/ControlTable.vue';
import {context} from 'inspecjs';
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

const vuetify = new Vuetify();
let wrapper: Wrapper<Vue>;
let profInfoWrapper: Wrapper<Vue>;
let scrWrapper: Wrapper<Vue>;
let statusChartWrapper: Wrapper<Vue>;
let sevChartWrapper: Wrapper<Vue>;
let compChartWrapper: Wrapper<Vue>;
let controlTableWrapper: Wrapper<Vue>;

wrapper = shallowMount(Results, {
  vuetify,
  propsData: {}
});

loadSample('Acme Overlay Example');
selectAllFiles();

describe('Profile Info', () => {
  it('shows correct number of files', () => {
    loadAll();
    selectAllFiles();
    expect((wrapper.vm as any).file_filter.length).toBe(
      FilteredDataModule.selected_file_ids.length
    );
  });

  it('no children', () => {
    removeAllFiles();
    loadSample('NGINX Clean Sample');
    selectAllFiles();

    profInfoWrapper = shallowMount(ProfData, {
      vuetify,
      propsData: {
        selected_prof: (wrapper.vm as any).root_profiles[0]
      }
    });

    expect((profInfoWrapper.vm as any).items.length).toBe(0);
  });

  it('2 children', () => {
    removeAllFiles();
    loadSample('Acme Overlay Example');
    selectAllFiles();

    profInfoWrapper = shallowMount(ProfData, {
      vuetify,
      propsData: {
        selected_prof: (wrapper.vm as any).root_profiles[0]
      }
    });

    let actual = [
      (profInfoWrapper.vm as any).items[0].name,
      (profInfoWrapper.vm as any).items[1].name
    ];
    let expected = ['ssh-baseline', 'ssl-baseline'];

    expect(actual).toEqual(expected);
  });

  it('children of children', () => {
    removeAllFiles();
    loadSample('Triple Overlay Example');
    selectAllFiles();

    profInfoWrapper = shallowMount(ProfData, {
      vuetify,
      propsData: {
        selected_prof: (wrapper.vm as any).root_profiles[0]
      }
    });

    expect((profInfoWrapper.vm as any).items[0].children[0].name).toBe(
      'Oracle Database 12c Security Technical Implementation Guide'
    );
  });

  it('parent has correct data', () => {
    let expected: InfoItem[] = [
      {label: 'Version', text: '0.1.0'},
      {label: 'From file', text: 'Triple Overlay Example'},
      {label: 'Start time', text: '2020-06-01T18:50:31+00:00'},
      {
        label: 'Sha256 Hash',
        text: '3fe40f9476a23b5b4dd6c0da2bb8dbe8ca5a4a8b6bfb27ffbf9f1797160c0f91'
      },
      {label: 'Title', text: '.'},
      {label: 'Maintainer', text: 'CMS InSpec Dev Team'},
      {label: 'Copyright', text: '.'},
      {label: 'Controls', text: '200'}
    ];
    expect((profInfoWrapper.vm as any).selected_info).toEqual(expected);
  });

  it('children have correct data', () => {
    let expected: InfoItem[] = [
      {label: 'Version', text: '0.1.0'},
      {label: 'From file', text: 'Triple Overlay Example'},
      {label: 'Start time', text: '2020-06-01T18:50:31+00:00'},
      {
        label: 'Sha256 Hash',
        text: 'a34d4b2bb6d5675173abdb1df727cc552807b5c80c1d5de027b85c640f8a0fee'
      },
      {label: 'Title', text: 'InSpec Profile'},
      {label: 'Maintainer', text: 'The Authors'},
      {label: 'Copyright', text: 'The Authors'},
      {label: 'Copyright Email', text: 'you@example.com'},
      {label: 'Controls', text: '200'}
    ];
    (profInfoWrapper.vm as any).active = [];
    (profInfoWrapper.vm as any).child_active = [
      profile_unique_key((wrapper.vm as any).visible_profiles[1])
    ];
    expect((profInfoWrapper.vm as any).selected_info).toEqual(expected);
  });
});

describe('Datatable', () => {
  it('displays correct number of controls with many files', () => {
    removeAllFiles();
    loadAll();
    selectAllFiles();
    controlTableWrapper = shallowMount(ControlTable, {
      vuetify,
      propsData: {
        filter: (wrapper.vm as any).all_filter
      }
    });
    let expected =
      expectedCount('passed') +
      expectedCount('failed') +
      expectedCount('notReviewed') +
      expectedCount('notApplicable') +
      expectedCount('profileError');
    expect((controlTableWrapper.vm as any).items.length).toBe(expected);
  });

  it('control row and table data is correct', () => {
    expect(
      (controlTableWrapper.vm as any).items
        .map((item: ListElt) => item.control.data.id)
        .sort()
    ).toEqual(
      FilteredDataModule.controls({
        fromFile: FilteredDataModule.selected_file_ids,
        omit_overlayed_controls: true
      })
        .map(c => c.data.id)
        .sort()
    );
  });
});
