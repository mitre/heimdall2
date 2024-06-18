<template>
  <v-container fluid class="font-weight-bold">
    <div
      ref="controlTableTitle"
      :class="
        $vuetify.breakpoint.smAndDown
          ? 'control-table-title'
          : 'pinned-header control-table-title'
      "
      :style="controlTableTitleStyle"
    >
      <!-- Toolbar -->
      <v-row v-resize="onResize">
        <v-row>
          <v-col cols="12" md="3" class="pb-0">
            <v-card-title class="pb-0">Results View Data</v-card-title>
          </v-col>
          <v-spacer />
          <v-col cols="3" md="auto" class="text-right pl-6 pb-0">
            <v-switch
              v-model="displayUnviewedControls"
              label="Show Only Unviewed"
            />
          </v-col>
          <v-col cols="3" md="auto" class="text-right pb-0">
            <v-switch v-model="syncTabs" label="Sync Tabs" />
          </v-col>
          <v-col cols="3" md="auto" class="text-right pb-0">
            <v-switch
              v-model="singleExpand"
              label="Single Expand"
              @change="handleToggleSingleExpand"
            />
          </v-col>
          <v-col cols="3" md="auto" class="text-right pb-0">
            <v-switch v-model="expandAll" label="Expand All" class="mr-5" />
          </v-col>
        </v-row>
      </v-row>

      <!-- Header. This should mirror the structure of ControlRowHeader -->
      <ResponsiveRowSwitch>
        <template #status>
          <ColumnHeader
            text="Status"
            :sort="sortStatus"
            @input="set_sort('status', $event)"
          />
        </template>

        <template #set>
          <ColumnHeader
            text="Result Set"
            :sort="sortSet"
            @input="set_sort('set', $event)"
          />
        </template>

        <template #id>
          <v-row class="pa-3">
            <ColumnHeader
              text="ID"
              :sort="sortId"
              @input="set_sort('id', $event)"
            />
            <v-tooltip bottom>
              <template #activator="{on, attrs}">
                <v-icon
                  class="ml-0"
                  small
                  style="cursor: pointer"
                  v-bind="attrs"
                  v-on="on"
                  >mdi-information-outline</v-icon
                >
              </template>
              <span>ID <br />(Legacy ID) </span>
            </v-tooltip>
          </v-row>
        </template>

        <template #title>
          <ColumnHeader text="Title" sort="disabled" />
        </template>

        <template #severity>
          <v-row class="pa-3">
            <ColumnHeader
              :text="'Severity'"
              :sort="sortSeverity"
              @input="set_sort('severity', $event)"
            />
            <v-tooltip bottom>
              <template #activator="{on, attrs}">
                <v-icon
                  class="ml-0"
                  small
                  style="cursor: pointer"
                  v-bind="attrs"
                  v-on="on"
                  >mdi-information-outline</v-icon
                >
              </template>
              <span
                >Control severity (NONE, LOW, MEDIUM, HIGH, or CRITICAL)</span
              >
            </v-tooltip>
          </v-row>
        </template>

        <template #impact>
          <v-row class="pa-3">
            <ColumnHeader
              :text="'Impact'"
              :sort="sortImpact"
              @input="set_sort('impact', $event)"
            />
            <v-tooltip bottom>
              <template #activator="{on, attrs}">
                <v-icon
                  class="ml-0"
                  small
                  style="cursor: pointer"
                  v-bind="attrs"
                  v-on="on"
                  >mdi-information-outline</v-icon
                >
              </template>
              <span
                >Control impact normailzed to range from 0 to 10 <br />0: No
                impact <br />1-3: Low impact <br />4-6: Medium impact <br />7-8:
                High impact <br />9-10: Critical impact
              </span>
            </v-tooltip>
          </v-row>
        </template>

        <template #tags>
          <ColumnHeader text="800-53 Controls & CCIs" sort="disabled" />
        </template>

        <template #runTime>
          <ColumnHeader
            text="Run Time"
            :sort="sortRunTime"
            @input="set_sort('runTime', $event)"
          />
        </template>

        <template #viewed>
          <ColumnHeader
            text="Controls Viewed"
            sort="disabled"
            :viewed-header="true"
            :number-of-viewed-controls="numOfViewed"
            :number-of-all-controls="raw_items.length"
          />
        </template>
      </ResponsiveRowSwitch>
    </div>

    <!-- Body -->
    <v-lazy
      v-for="item in items"
      :key="item.key"
      min-height="50"
      transition="fade-transition"
    >
      <div :id="striptoChars(item.key)">
        <ControlRowHeader
          :class="$vuetify.breakpoint.smAndDown ? '' : 'pinned-header'"
          :style="controlRowPinOffset"
          :control="item.control"
          :expanded="expanded.includes(item.key)"
          :viewed-controls="viewedControlIds"
          @toggle="toggle(item.key)"
          @control-viewed="toggleControlViewed"
        />
        <ControlRowDetails
          v-if="expanded.includes(item.key)"
          :control="item.control"
          :tab="syncTabs ? syncTab : undefined"
          @update:tab="updateTab"
        />
      </div>
    </v-lazy>
  </v-container>
</template>

<script lang="ts">
import ControlRowDetails from '@/components/cards/controltable/ControlRowDetails.vue';
import ControlRowHeader from '@/components/cards/controltable/ControlRowHeader.vue';
import ResponsiveRowSwitch from '@/components/cards/controltable/ResponsiveRowSwitch.vue';
import ColumnHeader, {Sort} from '@/components/generic/ColumnHeader.vue';
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {HeightsModule} from '@/store/heights';
import {getControlRunTime} from '@/utilities/delta_util';
import {control_unique_key} from '@/utilities/format_util';
import {ContextualizedControl} from 'inspecjs';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Ref} from 'vue-property-decorator';

// Tracks the visibility of an HDF control
interface ListElt {
  // A unique id to be used as a key.
  key: string;

  filename: string;

  // Computed values for status and impact, for sorting
  status_val: number;
  impact_val: number;
  severity_val: number;

  control: ContextualizedControl;
}

@Component({
  components: {
    ControlRowHeader,
    ControlRowDetails,
    ColumnHeader,
    ResponsiveRowSwitch
  }
})
export default class ControlTable extends Vue {
  @Ref('controlTableTitle') readonly controlTableTitle!: Element;
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  // Whether to allow multiple expansions
  singleExpand = true;

  // If the currently selected tab should sync
  syncTabs = false;
  syncTab = 'tab-test';

  // List of currently expanded options. If unique id is in here, it is expanded
  expanded: string[] = [];

  // Sorts
  sortId: Sort = 'none';
  sortStatus: Sort = 'none';
  sortSet: Sort = 'none';
  sortImpact: Sort = 'none';
  sortSeverity: Sort = 'none';
  sortRunTime: Sort = 'none';

  // Used for viewed/unviewed controls.
  viewedControlIds: string[] = [];
  displayUnviewedControls = true;

  get numOfViewed() {
    return this.raw_items.filter((elem) =>
      this.viewedControlIds.some((id) => elem.control.data.id === id)
    ).length;
  }

  toggleControlViewed(control: ContextualizedControl) {
    const alreadyViewed = this.viewedControlIds.indexOf(control.data.id);
    // If the control hasn't been marked as viewed yet, mark it as viewed.
    if (alreadyViewed === -1) {
      this.viewedControlIds.push(control.data.id);
    }
    // Else, remove it from the view controls array.
    else {
      this.viewedControlIds.splice(alreadyViewed, 1);
    }
  }

  mounted() {
    this.onResize();
  }

  onResize() {
    // Allow the page to settle before checking the controlTableHeader height
    // (this is what $nextTick is supposed to do but it's firing too quickly)
    setTimeout(() => {
      HeightsModule.setControlTableHeaderHeight(
        this.controlTableTitle?.clientHeight
      );
    }, 2000);
  }

  /** Callback to handle setting a new sort */
  set_sort(column: string, newSort: Sort) {
    this.sortId = 'none';
    this.sortSet = 'none';
    this.sortStatus = 'none';
    this.sortImpact = 'none';
    this.sortSeverity = 'none';
    this.sortRunTime = 'none';
    switch (column) {
      case 'id':
        this.sortId = newSort;
        break;
      case 'status':
        this.sortStatus = newSort;
        break;
      case 'set':
        this.sortSet = newSort;
        break;
      case 'impact':
        this.sortImpact = newSort;
        break;
      case 'severity':
        this.sortSeverity = newSort;
        break;
      case 'runTime':
        this.sortRunTime = newSort;
        break;
    }
  }

  get expandAll() {
    return this.expanded.length === this.items.length;
  }

  set expandAll(value: boolean) {
    if (value) {
      this.singleExpand = false;
      this.expanded = this.items.map((items) => items.key);
    } else {
      this.expanded = [];
    }
  }

  get controlTableTitleStyle() {
    return {top: `${HeightsModule.topbarHeight}px`};
  }

  get controlRowPinOffset() {
    // There is ~10px of padding being added which makes the ControlRowHeader look out of place
    return {top: `${this.topOfPage - 10}px`};
  }

  // The top of the page, relative to the topbar and the title bar
  get topOfPage() {
    return HeightsModule.topbarHeight + HeightsModule.controlTableHeaderHeight;
  }

  /** Closes all open controls when single-expand is re-enabled */
  async handleToggleSingleExpand(singleExpand: boolean): Promise<void> {
    if (singleExpand) {
      this.expandAll = false;
    }
  }

  async updateTab(tab: string) {
    this.syncTab = tab;
  }

  /** Toggles the given expansion of a control details panel */
  toggle(key: string) {
    if (this.singleExpand) {
      // Check if key already there
      const had = this.expanded.includes(key);

      // Clear
      this.expanded = [];

      // If key is new, add it
      if (!had) {
        this.expanded.push(key);
        this.jump_to_key(key);
      }
    } else {
      // Add or remove it from the set, as appropriate. Shortcut this by only adding if delete fails
      const i = this.expanded.indexOf(key);
      if (i < 0) {
        this.expanded.push(key);
        this.jump_to_key(key);
      } else {
        this.expanded.splice(i, 1);
      }
    }
  }

  jump_to_key(key: string) {
    if (!this.$vuetify.breakpoint.smAndDown) {
      this.$nextTick(() => {
        this.$vuetify.goTo(`#${this.striptoChars(key)}`, {
          offset: this.topOfPage,
          duration: 300
        });
      });
    }
  }

  striptoChars(key: string) {
    return key.replace(/[^a-z0-9]/gi, '');
  }

  /** Return items as key, value pairs */
  get raw_items(): ListElt[] {
    return FilteredDataModule.controls(this.filter).map((d) => {
      const key = control_unique_key(d);

      // File, hdf wrapper
      return {
        key,
        control: d,
        status_val: [
          'Passed',
          'Not Applicable',
          'No Data',
          'Not Reviewed',
          'Profile Error',
          'Failed'
        ].indexOf(d.root.hdf.status),
        impact_val: d.root.data.impact,
        severity_val: ['none', 'low', 'medium', 'high', 'critical'].indexOf(
          d.root.hdf.severity
        ),
        filename: _.get(
          d,
          'sourcedFrom.sourcedFrom.from_file.filename'
        ) as unknown as string
      };
    });
  }

  /** Return items sorted and filters out viewed controls */
  get items(): ListElt[] {
    // Controls ascending/descending
    let factor = 1;
    // Whether or not we need to sort
    let sort = true;
    // Our comparator function
    let cmp: (a: ListElt, b: ListElt) => number;

    let items = this.raw_items;

    if (this.sortId === 'ascending' || this.sortId === 'descending') {
      cmp = (a: ListElt, b: ListElt) =>
        a.control.data.id.localeCompare(b.control.data.id);
      if (this.sortId === 'ascending') {
        factor = -1;
      }
    } else if (
      this.sortStatus === 'ascending' ||
      this.sortStatus === 'descending'
    ) {
      cmp = (a: ListElt, b: ListElt) => a.status_val - b.status_val;
      if (this.sortStatus === 'ascending') {
        factor = -1;
      }
    } else if (
      this.sortImpact === 'ascending' ||
      this.sortImpact === 'descending'
    ) {
      cmp = (a: ListElt, b: ListElt) => a.impact_val - b.impact_val;
      if (this.sortImpact === 'ascending') {
        factor = -1;
      }
    } else if (
      this.sortSeverity === 'ascending' ||
      this.sortSeverity === 'descending'
    ) {
      cmp = (a: ListElt, b: ListElt) => a.severity_val - b.severity_val;
      if (this.sortSeverity === 'ascending') {
        factor = -1;
      }
    } else if (this.sortSet === 'ascending' || this.sortSet === 'descending') {
      cmp = (a: ListElt, b: ListElt) => a.filename.localeCompare(b.filename);
      if (this.sortSet === 'ascending') {
        factor = -1;
      }
    } else if (
      this.sortRunTime === 'ascending' ||
      this.sortRunTime === 'descending'
    ) {
      cmp = (a: ListElt, b: ListElt) =>
        getControlRunTime(b.control) - getControlRunTime(a.control);
      if (this.sortRunTime === 'ascending') {
        factor = -1;
      }
    } else {
      sort = false;
    }

    // Displays only unviewed controls.
    if (this.displayUnviewedControls) {
      items = items.filter(
        (val) => !this.viewedControlIds.includes(val.control.data.id)
      );
    }

    if (sort === true) {
      items = items.sort((a, b) => cmp(a, b) * factor);
    }

    return items;
  }
}
</script>

<style scoped>
.pinned-header {
  position: sticky;
  z-index: 2;
  padding-top: 2px;
  padding-bottom: 2px;
}

.control-table-title {
  background-color: var(--v-secondary-lighten1);
  z-index: 10;
}
</style>
