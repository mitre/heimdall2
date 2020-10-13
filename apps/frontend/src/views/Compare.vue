<template>
  <BaseView v-resize="on_resize" :title="curr_title">
    <!-- Topbar config - give it a search bar -->
    <template #topbar-content>
      <v-text-field
        v-model="search_term"
        flat
        solo
        hide-details
        prepend-inner-icon="mdi-magnify"
        label="Search"
        clearable
      />
    </template>

    <!-- The main content: comparisons of each set of controls in control_sets, etc -->
    <template #main-content>
      <v-container fluid grid-list-md pa-2>
        <v-row>
          <v-col cols="12">
            <div style="position:relative; top:14px;">
              <h1>Results Comparisons</h1>
            </div>
          </v-col>
        </v-row>
        <v-tabs v-model="tab" fixed-tabs icons-and-text show-arrows>
          <v-tab key="status" @click="changeTab(0)">
            <v-flex style="padding-top: 28px;">
              Status by Results File
              <v-icon small>mdi-unfold-more-horizontal</v-icon>
            </v-flex>
          </v-tab>
          <v-tab key="compliance" @click="changeTab(1)">
            <v-flex style="padding-top: 28px;">
              % Compliance
              <v-icon small>mdi-unfold-more-horizontal</v-icon>
            </v-flex>
          </v-tab>
          <v-tab key="severity" @click="changeTab(2)">
            <v-flex style="padding-top: 28px;">
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
                  <v-row>
                    <v-sheet color="#303030" class="mx-auto" max-width="100%">
                      <v-slide-group :show-arrows="true" :elevation="0">
                        <v-slide-item
                          v-for="(file, i) in files"
                          :key="i"
                          class="mx-2 my-2"
                        >
                          <v-card class="fill-height">
                            <v-card-title class="justify-center">
                              <div style="text-align:center;">
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
                                :value="null"
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
          <v-row>
            <v-col cols="4" xs="4" sm="3" md="2" lg="2" xl="2">
              <v-card-title>Test Results</v-card-title>
            </v-col>
            <v-col>
              <v-checkbox
                v-model="checkbox"
                color="blue"
                :label="'Display Only Changed Results'"
              />
            </v-col>
          </v-row>
          <hr />
          <v-row>
            <v-col cols="3" xs="3" sm="2" md="1" lg="1" xl="1">
              <br />
              <v-row>
                <v-col cols="8">
                  <div style="text-align: right;">
                    <v-btn
                      icon
                      small
                      style="float: left; padding-bottom: 8px; padding-left: 7px;"
                      @click="changeSort"
                    >
                      <v-icon v-if="ascending">mdi-sort-descending</v-icon>
                      <v-icon v-else>mdi-sort-ascending</v-icon>
                    </v-btn>
                    <strong
                      v-if="
                        (width > 960 &&
                          $vuetify.breakpoint.name != 'md' &&
                          $vuetify.breakpoint.name != 'lg') ||
                          width > 1800
                      "
                      >Test ID</strong
                    >
                    <strong v-else>ID</strong>
                  </div>
                </v-col>
                <v-col cols="4">
                  <v-btn icon small style="float: right;">
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
            v-for="(control_set, i) in show_sets"
            :key="i"
            :controls="control_set"
            :shown_files="num_shown_files"
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

import {FilteredDataModule} from '@/store/data_filters';
import {ControlStatus, context} from 'inspecjs';
import {SeverityCountModule} from '@/store/severity_counts';

import {ComparisonContext, ControlSeries} from '@/utilities/delta_util';
import {Category} from '@/components/generic/ApexPieChart.vue';
import {StatusCountModule} from '@/store/status_counts';
import ProfileRow from '@/components/cards/comparison/ProfileRow.vue';
import StatusChart from '@/components/cards/StatusChart.vue';
import {EvaluationFile, FileID} from '@/store/report_intake';
import {InspecDataModule} from '@/store/data_store';

import ApexLineChart, {
  SeriesItem
} from '@/components/generic/ApexLineChart.vue';
//@ts-ignore
import resize from 'vue-resize-directive';
import {get_eval_start_time} from '@/utilities/delta_util';

// We declare the props separately
// to make props types inferrable.
const Props = Vue.extend({
  props: {}
});

@Component({
  components: {
    BaseView,
    Modal,
    CompareRow,
    ProfileRow,
    StatusChart,
    ApexLineChart
  },
  directives: {
    resize
  }
})
export default class Compare extends Props {
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

  checkbox: boolean = true;
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

  /** Yields the control pairings in a more easily consumable list form */
  get control_sets(): ControlSeries[] {
    return Object.values(this.curr_delta.pairings);
  }

  /** Yields the control pairings that have changed*/
  get delta_sets(): ControlSeries[] {
    function get_status_safe(ctrl: null | context.ContextualizedControl) {
      if (ctrl == null) {
        return 'No Data';
      }
      return ctrl.hdf.status;
    }
    return this.searched_sets.filter(series => {
      // Get the first status. If no change, all should equal this
      let first;
      for (let i = 0; i < series.length; i++) {
        if (get_status_safe(series[i]) !== 'No Data') {
          first = get_status_safe(series[i]);
          break;
        }
      }
      for (let i = 1; i < series.length; i++) {
        // Check if the status has changed. If so, keep
        if (
          get_status_safe(series[i]) !== first &&
          get_status_safe(series[i]) !== 'No Data'
        ) {
          return true;
        }
      }
      return false;
    });
  }

  get searched_sets(): ControlSeries[] {
    let term = (this.search_term || '').toLowerCase().trim();
    if (term == '') {
      return this.control_sets;
    }
    function contains_term(
      context_control: context.ContextualizedControl,
      term: string
    ): boolean {
      let as_hdf = context_control.root.hdf;
      // Get our (non-null) searchable data
      let searchables: string[] = [
        as_hdf.wraps.id,
        as_hdf.wraps.title,
        as_hdf.wraps.code,
        as_hdf.severity,
        as_hdf.status,
        as_hdf.finding_details
      ].filter(s => s !== null) as string[];

      // See if any contain term
      return searchables.some(s => s.toLowerCase().includes(term));
    }
    let searched: ControlSeries[] = [];
    for (let series of this.control_sets) {
      for (let ctrl of series) {
        if (ctrl == null) {
          continue;
        } else if (contains_term(ctrl!, this.search_term)) {
          searched.push(series);
          break;
        }
      }
    }
    return searched;
  }

  get show_sets(): ControlSeries[] {
    let sorted = [];
    if (this.checkbox) {
      if (this.ascending) {
        return this.delta_sets;
      }
      sorted = [...this.delta_sets];
      sorted.reverse();
      return sorted;
    }
    if (this.ascending) {
      return this.searched_sets;
    }
    sorted = [...this.searched_sets];
    sorted.reverse();
    return sorted;
  }

  changeSort(): void {
    this.ascending = !this.ascending;
  }

  changeChartState(): void {
    this.chartsOpen = !this.chartsOpen;
  }

  get control_sort(): boolean {
    return this.ascending;
  }

  get statusCols(): number {
    if (this.width < 600) {
      return 12;
    }
    return Math.floor(12 / this.files.length);
  }

  get files(): EvaluationFile[] {
    let fileArr = [];
    let fileList = FilteredDataModule.evaluations(
      FilteredDataModule.selected_file_ids
    );
    for (let i = 0; i < fileList.length; i++) {
      fileArr.push(fileList[i].from_file);
    }

    fileArr = fileArr.sort((a, b) => {
      let a_date = new Date(
        FilteredDataModule.controls({fromFile: [a.unique_id]})[0].root.hdf
          .start_time || 0
      );
      let b_date = new Date(
        FilteredDataModule.controls({fromFile: [b.unique_id]})[0].root.hdf
          .start_time || 0
      );
      return a_date.valueOf() - b_date.valueOf();
    });
    return fileArr;
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
    var series = [];
    var low = {name: 'Failed Low Severity', data: this.sev_series[0]};
    var med = {name: 'Failed Medium Severity', data: this.sev_series[1]};
    var high = {name: 'Failed High Severity', data: this.sev_series[2]};
    var crit = {name: 'Failed Critical Severity', data: this.sev_series[3]};
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
    var names = [];
    for (let file of this.files) {
      let time = get_eval_start_time(file.evaluation) || undefined;
      names.push(time);
    }
    return names;
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
    if (this.$vuetify.breakpoint.name == 'xs') {
      if (this.files.length > 2) {
        return 2;
      }
      return this.files.length;
    } else if (this.$vuetify.breakpoint.name == 'sm') {
      if (this.files.length > 2) {
        return 2;
      }
    } else if (this.files.length > 2) {
      return 2;
    }
    return this.files.length;
  }

  on_resize(elt: any) {
    if (this.start_index > this.files.length - this.num_shown_files) {
      this.start_index = this.files.length - this.num_shown_files;
    }
    if (elt.clientWidth !== undefined && elt.clientWidth > 1) {
      this.width = elt.clientWidth - 24;
    }
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
        f => f.unique_id === this.file_filter[0]
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
    return FilteredDataModule.selected_evaluations;
  }
}
</script>

<style lang="scss" scoped>
.compare-header {
  top: 100px;
}
</style>
