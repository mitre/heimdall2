import 'jest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {shallowMount, Wrapper, createLocalVue} from '@vue/test-utils';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';

import Sidebar from '../../src/components/global/Sidebar.vue';
import VueRouter from 'vue-router';

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
  it('select/deselect all works', () => {
    // deselect all profiles and evaluations
    (wrapper.vm as any).toggle_all_profiles();
    (wrapper.vm as any).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids).toEqual([]);

    // select all profiles and evaluations
    (wrapper.vm as any).toggle_all_profiles();
    (wrapper.vm as any).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allFiles.length
    );

    // select profiles only
    (wrapper.vm as any).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allProfileFiles.length
    );

    // select evaluations only
    (wrapper.vm as any).toggle_all_profiles();
    (wrapper.vm as any).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allEvaluationFiles.length
    );
  });
});
