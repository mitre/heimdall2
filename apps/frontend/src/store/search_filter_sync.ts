import Store from '@/store/store';
import {Severity} from 'inspecjs';
import {Action, getModule, Module, VuexModule} from 'vuex-module-decorators';
import {ExtendedControlStatus, FilteredDataModule} from './data_filters';
import {SearchModule} from './search';

/* Alias types for all the search capabilities (minus status and severity as they already have a type) */
export type TitleSearchTerm = string;
export type DescriptionSearchTerm = string;
export type ControlIdSearchTerm = string;
export type CodeSearchTerm = string;
export type RuleIdSearchTerm = string;
export type VulIdSearchTerm = string;
export type StigIdSearchTerm = string;
export type ClassificationSearchTerm = string;
export type GroupNameSearchTerm = string;
export type CciSearchTerm = string;
export type IaControlsSearchTerm = string;
export type NistIdFilter = string;
export type KeywordsSearchTerm = string;
export type FilenameSearchTerm = string;

@Module({
  namespaced: true,
  dynamic: true,
  store: Store,
  name: 'searchFilterSyncData'
})
export class SearchFilterSyncData extends VuexModule {
  /**
   * Used at the end of the parseSearch function to make sure that status switches are updated with search bar text filters
   */
  @Action
  alterStatusBoolean() {
    for (const item of FilteredDataModule.controlStatusSwitches) {
      if (
        SearchModule.inFileSearchTerms.statusFilter.some(
          (statusFilter) =>
            statusFilter.value.toLowerCase() === item.value.toLowerCase()
        )
      ) {
        item.enabled = true;
      } else {
        item.enabled = false;
      }
    }
  }

  /**
   * Used at the end of the parseSearch function to make sure that severity switches are updated with search bar text filters
   */
  @Action
  alterSeverityBoolean() {
    for (const item of FilteredDataModule.severitySwitches) {
      if (
        SearchModule.inFileSearchTerms.severityFilter.some(
          (severityFilter) =>
            severityFilter.value.toLowerCase() === item.value.toLowerCase()
        )
      ) {
        item.enabled = true;
      } else {
        item.enabled = false;
      }
    }
  }

  /**
   * Handles the condition change when a status switch is clicked
   *
   * @param name - Status value of clicked switch
   *
   */
  @Action
  changeStatusSwitch(name: ExtendedControlStatus) {
    const statusSwitch = FilteredDataModule.controlStatusSwitches.find(
      (data) => data.name.toLowerCase() === name.toLowerCase()
    );
    if (statusSwitch) {
      statusSwitch.enabled = !statusSwitch.enabled;
      if (statusSwitch.enabled) {
        SearchModule.addSearchFilter({
          field: 'status',
          value: name.toLowerCase(),
          negated: false // Defaulted as false due to switch limitation
        });
      } else {
        SearchModule.removeSearchFilter({
          field: 'status',
          value: statusSwitch.value.toLowerCase(),
          negated: false // Defaulted as false due to switch limitation
        });
      }
    }
  }

  /**
   * Handles the condition change when a severity switch is clicked
   *
   * @param name - Severity value of clicked switch
   *
   */
  @Action
  changeSeveritySwitch(name: Severity) {
    const severitySwitch = FilteredDataModule.severitySwitches.find(
      (data) => data.name.toLowerCase() === name.toLowerCase()
    );
    if (severitySwitch) {
      severitySwitch.enabled = !severitySwitch.enabled;
      if (severitySwitch.enabled) {
        SearchModule.addSearchFilter({
          field: 'severity',
          value: name.toLowerCase(),
          negated: false // Defaulted as false due to switch limitation
        });
      } else {
        SearchModule.removeSearchFilter({
          field: 'severity',
          value: severitySwitch.value.toLowerCase(),
          negated: false // Defaulted as false due to switch limitation
        });
      }
    }
  }
}

export const SearchFilterSyncModule = getModule(SearchFilterSyncData);
