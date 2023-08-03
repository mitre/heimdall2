import Sidebar from '@/components/global/Sidebar.vue';
import {ExtendedControlStatus, FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {SearchModule} from '@/store/search';
import {createLocalVue, mount, shallowMount, Wrapper} from '@vue/test-utils';
import {LowercasedControlStatus, Severity} from 'inspecjs';
import 'jest';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuetify from 'vuetify';
import {EvaluationFile, ProfileFile} from '../../src/store/report_intake';
import {loadAll} from '../util/testingUtils';
import QuickFilters from '@/components/global/sidebaritems/QuickFilters.vue'
import DropdownFilters from '@/components/global/sidebaritems/DropdownFilters.vue'
import SelectedFilterTable from '@/components/global/sidebaritems/SelectedFilterTable.vue'

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

const quickFiltersWrapper: Wrapper<Vue> = shallowMount(QuickFilters, {
  localVue,
  router,
  vuetify,
  propsData: {}
});

const selectedFilterTableWrapper: Wrapper<Vue> = shallowMount(SelectedFilterTable, {
  localVue,
  router,
  vuetify,
  propsData: {}
});

const dropdownFiltersWrapper: Wrapper<Vue> = shallowMount(DropdownFilters, {
  localVue,
  router,
  vuetify,
  propsData: {
    properties: [
      'Keywords',
      'ID',
      'Vul ID',
      'Rule ID',
      'Title',
      'Nist',
      'Description',
      'Code',
      'Stig ID',
      'Classification',
      'IA Control',
      'Group Name',
      'CCIs'
    ],
    header: "Category Filters"
  }
});

describe('Sidebar tests', () => {
  it('will properly toggle filters', () => {
    // Toggle all status switches
    const statuses: LowercasedControlStatus[] = [
      'passed',
      'failed',
      'not applicable',
      'not reviewed'
    ];
    statuses.forEach((status: LowercasedControlStatus) => {
      (
        quickFiltersWrapper.vm as Vue & {
          changeStatusToggle: (name: LowercasedControlStatus) => void;
        }
      ).changeStatusToggle(status);
    });

    // Toggle all severity switches
    const severities: Severity[] = ['critical', 'high', 'medium', 'low'];
    severities.forEach((severity: Severity) => {
      (
        quickFiltersWrapper.vm as Vue & {
          changeSeverityToggle: (name: Severity) => void;
        }
      ).changeSeverityToggle(severity);
    });

    // Add a category filter
    (
      dropdownFiltersWrapper.vm as Vue & {
        addCategoryFilter: (field: string, value: string) => void;
      }
    ).addCategoryFilter('Rule ID', 'SV-864');

    // Current search term
    let search = SearchModule.searchTerm;
    // Current filter from parsed search term
    let currentFilters = (
      selectedFilterTableWrapper.vm as Vue & {
        currentFilters: Array<object>;
      }
    ).currentFilters;
    // Items in the data table
    let tableFilters = (
      selectedFilterTableWrapper.vm as Vue & {
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
      selectedFilterTableWrapper.vm as Vue & {
        removeAllFilters: () => void;
      }
    ).removeAllFilters();
    search = SearchModule.searchTerm;
    SearchModule.parseSearch();
    currentFilters = (
      selectedFilterTableWrapper.vm as Vue & {
        currentFilters: Array<object>;
      }
    ).currentFilters;
    tableFilters = (
      selectedFilterTableWrapper.vm as Vue & {
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
