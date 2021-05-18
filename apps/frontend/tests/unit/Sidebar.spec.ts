import Sidebar from '@/components/global/Sidebar.vue';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {createLocalVue, shallowMount, Wrapper} from '@vue/test-utils';
import 'jest';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify';
import {EvaluationFile, ProfileFile} from '../../src/store/report_intake';
import {loadAll} from '../util/testingUtils';

const vuetify = new Vuetify();
const localVue = createLocalVue();
localVue.use(VueRouter);
const router = new VueRouter();

const wrapper: Wrapper<Vue> = shallowMount(Sidebar, {
  localVue,
  router,
  vuetify,
  propsData: {}
});

describe('Sidebar tests', () => {
  it('has the correct number of sidebar links', () => {
    loadAll();
    expect(
      (
        wrapper.vm as Vue & {
          visible_evaluation_files: EvaluationFile[];
        }
      ).visible_evaluation_files.length
    ).toBe(InspecDataModule.allEvaluationFiles.length);
    expect(
      (
        wrapper.vm as Vue & {
          visible_profile_files: ProfileFile[];
        }
      ).visible_profile_files.length
    ).toBe(InspecDataModule.allProfileFiles.length);
  });

  it('displays properly when select/deselect is clicked', () => {
    // deselect all profiles and evaluations
    (
      wrapper.vm as Vue & {
        toggle_all_profiles: () => void;
      }
    ).toggle_all_profiles();
    (
      wrapper.vm as Vue & {
        toggle_all_evaluations: () => void;
      }
    ).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids).toEqual([]);

    // select all profiles and evaluations
    (
      wrapper.vm as Vue & {
        toggle_all_profiles: () => void;
      }
    ).toggle_all_profiles();
    (
      wrapper.vm as Vue & {
        toggle_all_evaluations: () => void;
      }
    ).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allFiles.length
    );

    // select profiles only
    (
      wrapper.vm as Vue & {
        toggle_all_evaluations: () => void;
      }
    ).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allProfileFiles.length
    );

    // select evaluations only
    (
      wrapper.vm as Vue & {
        toggle_all_profiles: () => void;
      }
    ).toggle_all_profiles();
    (
      wrapper.vm as Vue & {
        toggle_all_evaluations: () => void;
      }
    ).toggle_all_evaluations();
    expect(FilteredDataModule.selected_file_ids.length).toEqual(
      InspecDataModule.allEvaluationFiles.length
    );
  });
});
