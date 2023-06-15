<template>
  <div>
    <h1 class="my-4">Quick Filters:</h1>
    <v-row class="my-4">
      <v-col v-for="item in controlStatusSwitches" :key="item.name" :cols="3">
        {{ item.name }}
      </v-col>
    </v-row>
    <v-row class="mt-n10">
      <v-col v-for="item in controlStatusSwitches" :key="item.name" :cols="3">
        <v-switch
          dense
          inset
          :color="item.color"
          :input-value="item.enabled"
          @change="changeStatusToggle(item.value)"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="item in severitySwitches" :key="item.name" :cols="3">
        {{ item.name }}
      </v-col>
    </v-row>
    <v-row class="mt-n10">
      <v-col v-for="item in severitySwitches" :key="item.name" :cols="3">
        <v-switch
          dense
          inset
          :color="item.color"
          :input-value="item.enabled"
          @change="changeSeverityToggle(item.value)"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import {ExtendedControlStatus, FilteredDataModule} from '@/store/data_filters';
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
