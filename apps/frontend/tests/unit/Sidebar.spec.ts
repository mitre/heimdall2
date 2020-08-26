import 'jest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {shallowMount, Wrapper} from '@vue/test-utils';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {selectAllFiles, loadAll} from '../util/testingUtils';
import Sidebar from '../../src/components/global/Sidebar.vue';

const vuetify = new Vuetify();
let wrapper: Wrapper<Vue>;

wrapper = shallowMount(Sidebar, {
  vuetify,
  propsData: {}
});

describe('Sidebar tests', () => {
  it('correct number of sidebar links', () => {
    loadAll();
    selectAllFiles();
    expect((wrapper.vm as any).visible_files.length).toBe(
      InspecDataModule.allFiles.length
    );
  });
  it('select/deselect all works', () => {
    (wrapper.vm as any).toggle_all();
    expect(FilteredDataModule.selected_file_ids).toEqual([]);
    (wrapper.vm as any).toggle_all();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allFiles.length
    );
  });
});
