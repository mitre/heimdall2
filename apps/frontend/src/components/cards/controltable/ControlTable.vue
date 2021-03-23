<template>
  <v-container fluid class="font-weight-bold">
    <!-- Toolbar -->
    <v-row class="mb-n7">
      <v-row>
        <v-col>
          <v-card-title>Results View Data</v-card-title>
        </v-col>
        <v-col cols="auto" class="text-right">
          <v-switch v-model="syncTabs" label="Sync Tabs" />
        </v-col>
        <v-col cols="auto" class="text-right">
          <v-switch
            v-model="singleExpand"
            label="Single Expand"
            @change="handleToggleSingleExpand"
          />
        </v-col>
        <v-col cols="auto" class="text-right">
          <v-switch v-model="expandAll" label="Expand All" class="mr-5" />
        </v-col>
      </v-row>
    </v-row>

    <!-- Header. This should mirror the structure of ControlRowHeader -->
    <ResponsiveRowSwitch style="position: sticky; top: 36px; z-index: 10">
      <template #status>
        <ColumnHeader
          text="Status"
          :sort="sort_status"
          @input="set_sort('status', $event)"
        />
      </template>

      <template #id>
        <ColumnHeader
          text="ID"
          :sort="sort_id"
          @input="set_sort('id', $event)"
        />
      </template>

      <template #severity>
        <ColumnHeader
          :text="showImpact ? 'Impact' : 'Severity'"
          :sort="sort_severity"
          @input="set_sort('severity', $event)"
        />
      </template>

      <template #title>
        <ColumnHeader text="Title" sort="disabled" />
      </template>

      <template #tags>
        <ColumnHeader text="800-53 Controls & CCIs" sort="disabled" />
      </template>
    </ResponsiveRowSwitch>

    <!-- Body -->
    <v-lazy
      v-for="item in items"
      :key="item.key"
      min-height="50"
      transition="fade-transition"
    >
      <div>
        <ControlRowHeader
          :control="item.control"
          :expanded="expanded.includes(item.key)"
          :show-impact="showImpact"
          @toggle="toggle(item.key)"
        />
        <ControlRowDetails
          v-if="expanded.includes(item.key)"
          :control="item.control"
          :tab="syncTabs ? syncTab : undefined"
          @update:tab="updateTab"
        />
      </div>
    </v-lazy>
    <div id="scrollMagicTriggerEnd" />
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import ControlRowHeader from '@/components/cards/controltable/ControlRowHeader.vue';
import ControlRowDetails from '@/components/cards/controltable/ControlRowDetails.vue';
import ColumnHeader, {Sort} from '@/components/generic/ColumnHeader.vue';
import ResponsiveRowSwitch from '@/components/cards/controltable/ResponsiveRowSwitch.vue';

import {Filter, FilteredDataModule} from '@/store/data_filters';
import {control_unique_key} from '@/utilities/format_util';
import {context} from 'inspecjs';
import {Prop} from 'vue-property-decorator';

// Tracks the visibility of an HDF control
interface ListElt {
  // A unique id to be used as a key.
  key: string;

  // Computed values for status and severity "value", for sorting
  status_val: number;
  severity_val: number;

  control: context.ContextualizedControl;
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
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  @Prop({type: Boolean, required: true}) readonly showImpact!: boolean;

  // Whether to allow multiple expansions
  singleExpand = true;

  // If the currently selected tab should sync
  syncTabs = false;
  syncTab = 'tab-test';

  // List of currently expanded options. If unique id is in here, it is expanded
  expanded: Array<string> = [];

  // Sorts
  sort_id: Sort = 'none';
  sort_status: Sort = 'none';
  sort_severity: Sort = 'none';

  /** Callback to handle setting a new sort */
  set_sort(column: 'id' | 'status' | 'severity', new_sort: Sort) {
    this.sort_id = 'none';
    this.sort_status = 'none';
    this.sort_severity = 'none';
    switch (column) {
      case 'id':
        this.sort_id = new_sort;
        break;
      case 'status':
        this.sort_status = new_sort;
        break;
      case 'severity':
        this.sort_severity = new_sort;
        break;
    }
  }

  get expandAll() {
    return this.expanded.length === this.items.length;
  }

  set expandAll(value: boolean) {
    if(value) {
      this.singleExpand = false;
      this.expanded = this.items.map((items) => items.key);
    } else {
      this.expanded = [];
    }
  }

  /** Closes all open controls when single-expand is re-enabled */
  async handleToggleSingleExpand(singleExpand: boolean): Promise<void> {
    if(singleExpand){
      this.expandAll = false;
    }
  }

  async updateTab(tab: string){
    this.syncTab = tab
  }

  /** Toggles the given expansion of a control details panel */
  toggle(key: string) {
    if (this.singleExpand) {
      // Check if key already there
      let had = this.expanded.includes(key);

      // Clear
      this.expanded = [];

      // If key is new, add it
      if (!had) {
        this.expanded.push(key);
      }
    } else {
      // Add or remove it from the set, as appropriate. Shortcut this by only adding if delete fails
      let i = this.expanded.indexOf(key);
      if (i < 0) {
        this.expanded.push(key);
      } else {
        this.expanded.splice(i, 1);
      }
    }
  }

  /** Return items as key, value pairs */
  get raw_items(): ListElt[] {
    return FilteredDataModule.controls(this.filter).map((d) => {
      let key = control_unique_key(d);

      // File, hdf wrapper
      let with_id: ListElt = {
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
        severity_val: ['none', 'low', 'medium', 'high', 'critical'].indexOf(
          d.root.hdf.severity
        )
      };
      return with_id;
    });
  }

  /** Return items sorted */
  get items(): ListElt[] {
    // Controls ascending/descending
    let factor: number = 1;
    // Our comparator function
    let cmp: (a: ListElt, b: ListElt) => number;

    if (this.sort_id === 'ascending' || this.sort_id === 'descending') {
      cmp = (a: ListElt, b: ListElt) =>
        a.control.data.id.localeCompare(b.control.data.id);
      if (this.sort_id === 'ascending') {
        factor = -1;
      }
    } else if (
      this.sort_status === 'ascending' ||
      this.sort_status === 'descending'
    ) {
      cmp = (a: ListElt, b: ListElt) => a.status_val - b.status_val;
      if (this.sort_status === 'ascending') {
        factor = -1;
      }
    } else if (
      this.sort_severity === 'ascending' ||
      this.sort_severity === 'descending'
    ) {
      cmp = (a: ListElt, b: ListElt) => a.severity_val - b.severity_val;
      if (this.sort_severity === 'ascending') {
        factor = -1;
      }
    } else {
      return this.raw_items;
    }
    return this.raw_items.sort((a, b) => cmp(a, b) * factor);
  }
}
</script>
