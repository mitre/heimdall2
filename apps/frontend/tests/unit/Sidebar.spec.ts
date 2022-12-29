import Sidebar from '@/components/global/Sidebar.vue';
import {ExtendedControlStatus, FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {SearchModule} from '@/store/search';
import {createLocalVue, shallowMount, Wrapper} from '@vue/test-utils';
import {Severity} from 'inspecjs';
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
  it('will properly toggle filters', () => {
    // Toggle all status switches
    const statuses: ExtendedControlStatus[] = [
      'Passed',
      'Failed',
      'Not Applicable',
      'Not Reviewed'
    ];
    statuses.forEach((status: ExtendedControlStatus) => {
      (
        wrapper.vm as Vue & {
          changeStatusToggle: (name: ExtendedControlStatus) => void;
        }
      ).changeStatusToggle(status);
    });

    // Toggle all severity switches
    const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
    severities.forEach((severity: Severity) => {
      (
        wrapper.vm as Vue & {
          changeSeverityToggle: (name: Severity) => void;
        }
      ).changeSeverityToggle(severity);
    });

    // Add a category filter
    (
      wrapper.vm as Vue & {
        addCategoryFilter: (field: string, value: string) => void;
      }
    ).addCategoryFilter('Rule ID', 'SV-864');

    // Current search term
    let search = SearchModule.searchTerm;
    // Current filter from parsed search term
    let currentFilters = (
      wrapper.vm as Vue & {
        currentFilters: Array<any>;
      }
    ).currentFilters;
    // Items in the data table
    let tableFilters = (
      wrapper.vm as Vue & {
        convertFilterData: (
          filters: {keyword: string; value: string; negated: boolean}[]
        ) => Array<{keyword: string; value: string; negated: string}>;
      }
    )
      //@ts-ignore
      .convertFilterData(currentFilters.conditionArray);

    expect(search).toBe(
      'status:passed,failed,"not applicable","not reviewed" severity:critical,high,medium,low ruleid:SV-864'
    );
    expect(tableFilters.length).toEqual(9);

    // After remove all function is called from selected filters table
    (
      wrapper.vm as Vue & {
        removeAllFilters: () => void;
      }
    ).removeAllFilters();
    search = SearchModule.searchTerm;
    SearchModule.parseSearch();
    currentFilters = (
      wrapper.vm as Vue & {
        currentFilters: Array<any>;
      }
    ).currentFilters;
    tableFilters = (
      wrapper.vm as Vue & {
        convertFilterData: (
          filters: {keyword: string; value: string; negated: boolean}[]
        ) => Array<{keyword: string; value: string; negated: string}>;
      }
    )
      //@ts-ignore
      .convertFilterData(currentFilters.conditionArray);

    expect(search).toBe('');
    expect(tableFilters.length).toBe(0);
  });

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
