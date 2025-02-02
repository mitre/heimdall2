import {
  FilteredDataModule,
  GenericSearchEntryValue
} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {SearchEntry, SearchModule} from '@/store/search';
import Checklist from '@/views/Checklist.vue';
import {ChecklistObject, ChecklistVuln} from '@mitre/hdf-converters';
import {shallowMount, Wrapper} from '@vue/test-utils';
import 'jest';
import _ from 'lodash';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {expectedCount, loadChecklistFile} from '../util/testingUtils';

const $router = {
  currentRoute: {
    path: '/checklists'
  }
};
const vuetify = new Vuetify();

const wrapper: Wrapper<Vue> = shallowMount(Checklist, {
  vuetify,
  mocks: {
    $router
  },
  propsData: {}
});

describe('Datatable', () => {
  it('displays correct number of rules with loaded checklist', async () => {
    await loadChecklistFile('Clean RHEL 8 Checklist');

    const expected =
      expectedCount('passed') +
      expectedCount('failed') +
      expectedCount('notReviewed') +
      expectedCount('notApplicable') +
      expectedCount('profileError');

    expect(
      (wrapper.vm as Vue & {allRules: Array<ChecklistVuln>}).allRules.length
    ).toBe(expected);
  });

  it('checklist row and table data is correct', () => {
    const rules: ChecklistVuln[] = [];
    const checklist: ChecklistObject = _.get(
      InspecDataModule.allChecklistFiles.find(
        (f) => f.uniqueId === FilteredDataModule.selectedChecklistId
      )?.evaluation.data,
      'passthrough.checklist'
    ) as unknown as ChecklistObject;
    checklist.stigs
      .map((stig) => stig.vulns)
      .forEach((rulesItems) => {
        rules.push(...rulesItems);
      });

    expect(
      (
        wrapper.vm as Vue & {
          allRules: Array<ChecklistVuln>;
        }
      ).allRules
        .map((item: ChecklistVuln) => item.ruleId)
        .sort()
    ).toEqual(rules.map((item: ChecklistVuln) => item.ruleId).sort());
  });

  it('displays correct number of rules with loaded checklist and filter', async () => {
    SearchModule.updateSearch(
      'status:Failed,"Not reviewed" severity:High,Low "empty password"'
    );
    SearchModule.parseSearch();
    const total_count: number = 4;

    expect(
      (
        wrapper.vm as Vue & {
          filteredRules: Array<ChecklistVuln>;
          all_filters: Array<SearchEntry<GenericSearchEntryValue>>;
        }
      ).filteredRules.length
    ).toBe(total_count);
  });
});
