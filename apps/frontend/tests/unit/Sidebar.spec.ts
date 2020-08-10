import 'jest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {getModule} from 'vuex-module-decorators';
import {shallowMount, Wrapper} from '@vue/test-utils';
import Store from '../../src/store/store';
import FilteredDataModule from '@/store/data_filters';
import InspecDataModule from '@/store/data_store';
import {selectAllFiles, loadAll} from '../util/testingUtils';
import Sidebar from '../../src/components/global/Sidebar.vue';

const vuetify = new Vuetify();
let wrapper: Wrapper<Vue>;

wrapper = shallowMount(Sidebar, {
  vuetify,
  propsData: {}
});

let filter_store = getModule(FilteredDataModule, Store);
let data_store = getModule(InspecDataModule, Store);

describe('Sidebar tests', () => {
  it('correct number of sidebar links', () => {
    loadAll();
    selectAllFiles();
    expect((wrapper.vm as any).visible_files.length).toBe(
      data_store.allFiles.length
    );
  });
  it('select/deselect all works', () => {
    (wrapper.vm as any).toggle_all();
    expect(filter_store.selected_file_ids).toEqual([]);
    (wrapper.vm as any).toggle_all();
    expect(filter_store.selected_file_ids.length).toEqual(
      data_store.allFiles.length
    );
  });
});
