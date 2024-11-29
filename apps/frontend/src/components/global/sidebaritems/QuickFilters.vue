<template>
  <v-card>
    <v-container>
      <h4>Common Filter Options:</h4>
      <p>For all types of scans (Results, Profiles, and Checklists)</p>

      <h5>Control Status</h5>
      <v-row>
        <v-col v-for="item in controlStatusSwitches" :key="item.name">
          <p>{{ item.name }}</p>
          <v-switch
            dense
            inset
            :color="item.color"
            :input-value="item.enabled"
            @change="changeStatusToggle(item.value)"
          />
        </v-col>
      </v-row>

      <h5>Severity</h5>
      <v-row>
        <v-col v-for="item in severitySwitches" :key="item.name">
          <p>{{ item.name }}</p>
          <v-switch
            dense
            inset
            :color="item.color"
            :input-value="item.enabled"
            @change="changeSeverityToggle(item.value)"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import {FilteredDataModule} from '@/store/data_filters';
import {SearchFilterSyncModule} from '@/store/search_filter_sync';
import {LowercasedControlStatus, Severity} from 'inspecjs';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class QuickFilters extends Vue {
  get controlStatusSwitches(): {
    name: string;
    value: LowercasedControlStatus;
    enabled: boolean;
    color: string;
  }[] {
    return FilteredDataModule.controlStatusSwitches;
  }

  get severitySwitches(): {
    name: string;
    value: Severity;
    enabled: boolean;
    color: string;
  }[] {
    return FilteredDataModule.severitySwitches;
  }

  changeSeverityToggle(name: Severity) {
    SearchFilterSyncModule.changeSeveritySwitch(name);
  }

  changeStatusToggle(name: LowercasedControlStatus) {
    SearchFilterSyncModule.changeStatusSwitch(name);
  }
}
</script>
