<template>
  <BaseView :title="curr_title">
    <!-- Topbar config - give it a search bar -->
    <template #topbar-content>
      <v-text-field
        v-model="search_term"
        flat
        solo
        dense
        hide-details
        prepend-inner-icon="mdi-magnify"
        label="Search"
        clearable
      />
      <UploadButton />
    </template>

    <template #main-content>
      <v-container fluid grid-list-md pa-2>
        <v-row>
          <v-col cols="12">
            <div style="position: relative">
              <h1>Results Comparison</h1>
            </div>
          </v-col>
        </v-row>
        <v-tabs v-model="tab" fixed-tabs icons-and-text show-arrows>
          <v-tab key="status" @click="changeTab(0)">
            <v-flex style="padding-top: 16px">
              Status by Results File
              <v-icon small>mdi-unfold-more-horizontal</v-icon>
            </v-flex>
          </v-tab>
          <v-tab key="compliance" @click="changeTab(1)">
            <v-flex style="padding-top: 16px">
              % Compliance
              <v-icon small>mdi-unfold-more-horizontal</v-icon>
            </v-flex>
          </v-tab>
          <v-tab key="severity" @click="changeTab(2)">
            <v-flex style="padding-top: 16px">
              Failed Tests by Severity
              <v-icon small>mdi-unfold-more-horizontal</v-icon>
            </v-flex>
          </v-tab>
        </v-tabs>
        <v-row>
          <v-col cols="12">
            <transition>
              <keep-alive>
                <v-col v-if="tab == 0 && ableTab" cols="12">
                  <v-row dense>
                    <v-sheet color="#303030" class="mx-auto" max-width="100%">
                      <v-slide-group :show-arrows="true" :elevation="0">
                        <v-slide-item
                          v-for="(file, i) in files"
                          :key="i"
                          class="mx-2 my-2"
                        >
                          <v-card class="fill-height">
                            <v-card-title class="justify-center">
                              <div style="text-align: center">
                                <em>{{ i + 1 }}</em>
                                <br />
                                {{ file.filename }}
                                <br />
                                <span>{{ fileTimes[i] }}</span>
                              </div>
                            </v-card-title>
                            <v-card-actions class="justify-center">
                              <StatusChart
                                :filter="{
                                  fromFile: [file.unique_id],
                                  omit_overlayed_controls: true
                                }"
                                :show_compliance="true"
                              />
                            </v-card-actions>
                          </v-card>
                        </v-slide-item>
                      </v-slide-group>
                    </v-sheet>
                  </v-row>
                </v-col>
                <v-col v-else-if="tab == 1 && ableTab" cols="12">
                  <ApexLineChart
                    :series="compliance_series"
                    :categories="fileTimes"
                    :upper_range="100"
                    :title="'Total Compliance'"
                    :y_title="'% Compliance'"
                  />
                </v-col>
                <v-col v-else-if="tab == 2 && ableTab" cols="12">
                  <ApexLineChart
                    :series="line_sev_series"
                    :categories="fileTimes"
                    :upper_range="total_failed + 1"
                    :sev_chart="true"
                    :title="'Failed Tests by Severity'"
                    :y_title="'Tests Failed'"
                  />
                </v-col>
                <v-col v-else cols="12" />
              </keep-alive>
            </transition>
          </v-col>
        </v-row>
        <v-card>
          <v-row no-gutters dense>
            <v-card-title class="mr-auto">Test Results</v-card-title>
            <v-checkbox
              v-model="changedOnly"
              dense
              color="blue"
              class="mr-3"
              label="Display Only Changed Results"
            />
          </v-row>
          <hr />
          <v-row dense>
            <v-col cols="3" sm="2" md="1">
              <br />
              <v-row>
                <v-col cols="8">
                  <div style="text-align: right">
                    <v-btn
                      icon
                      small
                      style="
                        float: left;
                        padding-bottom: 8px;
                        padding-left: 7px;
                      "
                      @click="changeSort"
                    >
                      <v-icon v-if="ascending">mdi-sort-descending</v-icon>
                      <v-icon v-else>mdi-sort-ascending</v-icon>
                    </v-btn>
                    <strong>Test ID</strong>
                  </div>
                </v-col>
                <v-col cols="4">
                  <v-btn icon small style="float: right">
                    <v-icon
                      v-if="files.length > num_shown_files"
                      :disabled="start_index == 0"
                      @click="scroll_left"
                      >mdi-arrow-left</v-icon
                    >
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
            <ProfileRow
              v-for="i in num_shown_files"
              :key="i - 1 + start_index"
              :name="files[i - 1 + start_index].filename"
              :start_time="fileTimes[i - 1]"
              :index="i + start_index"
              :show_index="files.length > num_shown_files"
            />
            <v-col cols="1">
              <br />
              <v-row>
                <v-col cols="12">
                  <v-btn icon small>
                    <v-icon
                      v-if="files.length > num_shown_files"
                      :disabled="start_index >= files.length - num_shown_files"
                      @click="scroll_right"
                      >mdi-arrow-right</v-icon
                    >
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-divider dark />
          <CompareRow
            v-for="[control_id, control_set] in show_sets"
            :key="control_id"
            :file-ids="visible_row_ids"
            :control-id="control_id"
            :controls="control_set"
            class="my-4"
            :shift="start_index"
            :expanded="expanded_view"
          />
        </v-card>
      </v-container>
    </template>
  </BaseView>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import BaseView from '@/views/BaseView.vue';
import Modal from '@/components/global/Modal.vue';
import CompareRow from '@/components/cards/comparison/CompareRow.vue';
import UploadButton from '@/components/generic/UploadButton.vue';

import {Filter, FilteredDataModule} from '@/store/data_filters';
import {ControlStatus} from 'inspecjs';
import {SeverityCountModule} from '@/store/severity_counts';

import {compare_times, ComparisonContext, ControlSeries} from '@/utilities/delta_util';
import {Category} from '@/components/generic/ApexPieChart.vue';
import {StatusCountModule} from '@/store/status_counts';
import ProfileRow from '@/components/cards/comparison/ProfileRow.vue';
import StatusChart from '@/components/cards/StatusChart.vue';
import {EvaluationFile, FileID} from '@/store/report_intake';
import {InspecDataModule} from '@/store/data_store';

import ApexLineChart, {
  SeriesItem
} from '@/components/generic/ApexLineChart.vue';
import {get_eval_start_time} from '@/utilities/delta_util';
import _ from 'lodash';

@Component({
  components: {
    BaseView,
    Modal,
    CompareRow,
    ProfileRow,
    StatusChart,
    ApexLineChart,
    UploadButton
  }
})
export default class Compare extends Vue {
  categories: Category<ControlStatus>[] = [
    {
      label: 'Passed',
      value: 'Passed',
      color: 'statusPassed'
    },
    {
      label: 'Failed',
      value: 'Failed',
      color: 'statusFailed'
    },
    {
      label: 'Not Applicable',
      value: 'Not Applicable',
      color: 'statusNotApplicable'
    },
    {
      label: 'Not Reviewed',
      value: 'Not Reviewed',
      color: 'statusNotReviewed'
    },
    {
      label: 'Profile Error',
      value: 'Profile Error',
      color: 'statusProfileError'
    }
  ];

  changedOnly = true;
  expanded_view: boolean = true;
  tab: number = 0;
  width: number = window.innerWidth;
  start_index: number = 0;
  ascending: boolean = true;
  chartsOpen: boolean = true;
  search_term: string = '';
  ableTab: boolean = true;
  expansion: number = 0;

  /** Yields the current two selected reports as an ExecDelta,  */
  get curr_delta(): ComparisonContext {
    let selected_data = FilteredDataModule.evaluations(
      FilteredDataModule.selected_file_ids
    );
    return new ComparisonContext(selected_data);
  }

  /** Yields the control pairings that have changed*/
  get delta_sets(): [string, ControlSeries][] {
    return this.searched_sets.filter(([_id, series]) => {
      const controls = Object.values(series).map((control) => control.root.hdf.status);
      // If some of the controls are not equal to the first one then it is changed and should be displayed
      // If the number of controls with information loaded about them is different than the number of files
      // loaded then something has been added/removed and should be displayed.
      return (controls.some((control) => control !== controls[0]) || controls.length !== FilteredDataModule.selected_file_ids.length);
    });
  }

  get filter(): Filter {
    return {
      fromFile: this.file_filter,
      search_term: this.search_term || '',
      omit_overlayed_controls: true
    };
  }

    // Use the FilteredDataModule to search and filter out keys that do not match
  get searched_sets(): [string, ControlSeries][] {
    const found = FilteredDataModule.controls(this.filter).map((value) => value.data.id);
    // Cross-reference the list of keys found above with the keys in the ControlSeriesLookup object
    // Then convert to a list of entries (destructured objects) for ease of use.
    return Object.entries(_.pickBy(this.curr_delta.pairings, (_id, key) => found.includes(key)));
  }

  get show_sets(): [string, ControlSeries][] {
    const sets: [string, ControlSeries][] = Array.from(this.changedOnly ? this.delta_sets : this.searched_sets);
    let searchModifier = -1;

    if(this.ascending) {
      searchModifier = 1;
    }
    return sets.sort(([a, _seriesA], [b, _seriesB]) => a.localeCompare(b) * searchModifier );
  }

  changeSort(): void {
    this.ascending = !this.ascending;
  }

  changeChartState(): void {
    this.chartsOpen = !this.chartsOpen;
  }

  get statusCols(): number {
    if (this.width < 600) {
      return 12;
    }
    return Math.floor(12 / this.files.length);
  }

  get files(): EvaluationFile[] {
    const fileList = Array.from(FilteredDataModule.evaluations(FilteredDataModule.selected_file_ids));

    fileList.sort(compare_times);
    return fileList.map((evaluation) => evaluation.from_file);
  }

  // Return the fileIDs for the visible rows in the correct order, so that the CompareRow
  // shows data matching the file headers.
  get visible_row_ids(): FileID[] {
    return this.files.map((file) => file.unique_id).slice(this.start_index, this.start_index + this.num_shown_files);
  }

  get sev_series(): number[][] {
    var series = [];
    var lowCounts = [];
    var medCounts = [];
    var highCounts = [];
    var critCounts = [];
    for (let file of this.files) {
      lowCounts.push(
        SeverityCountModule.low({
          fromFile: [file.unique_id],
          status: 'Failed',
          omit_overlayed_controls: true
        })
      );
      medCounts.push(
        SeverityCountModule.medium({
          fromFile: [file.unique_id],
          status: 'Failed',
          omit_overlayed_controls: true
        })
      );
      highCounts.push(
        SeverityCountModule.high({
          fromFile: [file.unique_id],
          status: 'Failed',
          omit_overlayed_controls: true
        })
      );
      critCounts.push(
        SeverityCountModule.critical({
          fromFile: [file.unique_id],
          status: 'Failed',
          omit_overlayed_controls: true
        })
      );
    }
    series.push(lowCounts);
    series.push(medCounts);
    series.push(highCounts);
    series.push(critCounts);
    return series;
  }

  get line_sev_series(): SeriesItem[] {
    const series = [];
    const low = {name: 'Failed Low Severity', data: this.sev_series[0]};
    const med = {name: 'Failed Medium Severity', data: this.sev_series[1]};
    const high = {name: 'Failed High Severity', data: this.sev_series[2]};
    const crit = {name: 'Failed Critical Severity', data: this.sev_series[3]};
    series.push(low);
    series.push(med);
    series.push(high);
    series.push(crit);
    return series;
  }

  get compliance_series(): SeriesItem[] {
    var series = [];
    for (let file of this.files) {
      let filter = {fromFile: [file.unique_id]};
      let passed = StatusCountModule.countOf(filter, 'Passed');
      let total =
        passed +
        StatusCountModule.countOf(filter, 'Failed') +
        StatusCountModule.countOf(filter, 'Profile Error') +
        StatusCountModule.countOf(filter, 'Not Reviewed');
      if (total == 0) {
        series.push(0);
      } else {
        series.push(Math.round((100.0 * passed) / total));
      }
    }
    return [{name: 'Compliance', data: series}];
  }

  get fileTimes(): (string | undefined)[] {
    return this.files.map((file) => get_eval_start_time(file.evaluation) || undefined );
  }

  get total_failed(): number {
    if (this.files.length < 1) {
      return 0;
    }
    let highest_failed = 0;
    for (let file of this.files) {
      let filter = {fromFile: [file.unique_id]};
      let failed = StatusCountModule.countOf(filter, 'Failed');
      if (failed > highest_failed) {
        highest_failed = failed;
      }
    }
    return highest_failed;
  }

  get num_shown_files(): number {
    if (this.files.length > 2) {
      return 2;
    }
    return this.files.length;
  }

  scroll_left() {
    this.start_index -= 1;
  }

  scroll_right() {
    this.start_index += 1;
  }

  changeTab(x: number) {
    if (this.tab == x) {
      this.ableTab = !this.ableTab;
    } else {
      this.ableTab = true;
    }
    this.changeChartState();
  }

  /**
   * The title to override with
   */

  get curr_title(): string {
    let returnText = 'Comparison View';
    if (this.file_filter.length == 1) {
      let file = InspecDataModule.allEvaluationFiles.find(
        (f) => f.unique_id === this.file_filter[0]
      );
      if (file) {
        returnText += ` (${file.filename} selected)`;
      }
    } else {
      returnText += ` (${this.file_filter.length} results selected)`;
    }
    return returnText;
  }

  get file_filter(): FileID[] {
    return FilteredDataModule.selectedEvaluationIds;
  }
}
</script>

<style lang="scss" scoped>
.compare-header {
  top: 100px;
}
</style>
