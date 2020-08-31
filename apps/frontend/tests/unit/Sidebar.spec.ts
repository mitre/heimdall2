import 'jest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {shallowMount, Wrapper, createLocalVue} from '@vue/test-utils';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {selectAllFiles, loadAll} from '../util/testingUtils';
import Sidebar from '../../src/components/global/Sidebar.vue';
import VueRouter from 'vue-router'

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueRouter);
const router = new VueRouter();

let wrapper: Wrapper<Vue>;

wrapper = shallowMount(Sidebar, {
  localVue,
  router,
  vuetify,
  propsData: {}
});

describe('Sidebar tests', () => {
  it('correct number of sidebar links', () => {
    loadAll();
    selectAllFiles();
    expect((wrapper.vm as any).visible_evaluation_files.length).toBe(
      InspecDataModule.allEvaluationFiles.length
    );
    expect((wrapper.vm as any).visible_profile_files.length).toBe(
      InspecDataModule.allProfileFiles.length
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
