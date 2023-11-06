<template>
  <v-card overflow-auto>
    <v-card-title class="pt-2">
      <div class="card-title">
        <div>
          <strong>
            Rules ({{ rules.length }} shown,
            {{ numTotalRules - rules.length }} hidden)
          </strong>
        </div>
        <div class="short-id-container">
          <v-switch
            input-value="true"
            class="short-id-switch"
            dense
            inset
            label="Short ID"
            color="teal"
            hide-details
            @change="$emit('toggle-short-id')"
          />
        </div>
      </div>
      <v-select
        v-model="selectedHeaders"
        :items="headersList"
        label="Select Columns"
        class="mt-4 pt-0"
        dark
        item-color="white"
        multiple
        outlined
        return-object
        height="50px"
      >
        <template #selection="{item, index}">
          <v-chip v-if="index < 3" small>
            <span>{{ item.text }}</span>
          </v-chip>
          <span v-if="index === 3" class="grey--text caption ml-2">
            (+{{ selectedHeaders.length - 3 }} others)
          </span>
        </template>
      </v-select>
    </v-card-title>
    <v-card-text>
      <!-- The mobile-breakpoint attribute fixes issues with the mobile resizing of a v-data-table-->
      <v-data-table
        :single-select="true"
        disable-pagination
        dense
        mobile-breakpoint="0"
        :items="rules"
        :item-class="checkSelected"
        :headers="headers"
        hide-default-footer
        class="overflow-auto"
        height="1200px"
        @click:row="showRule"
      >
        <template #[`item.status`]="{item}">
          <v-chip :color="statusColor(item.status)" small>
            <strong>{{ shortStatus(item.status) }}</strong>
          </v-chip>
        </template>
        <template #[`item.ruleversion`]="{item}">
          {{ shortStigId(item.ruleversion) }}
        </template>
        <template #[`item.ruleid`]="{item}">
          {{ shortRuleId(item.ruleid) }}
        </template>
        <template #[`item.cciref`]="{item}">
          {{ shortRuleId(item.cciref) }}
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {ChecklistFilter, FilteredDataModule} from '@/store/data_filters';
import {FileID} from '@/store/report_intake';
import {ChecklistVuln} from '@mitre/hdf-converters';
import {Component, Prop, Vue} from 'vue-property-decorator';
import {ControlStatus} from 'inspecjs';
import _ from 'lodash';

@Component
export default class ChecklistRulesTable extends Vue {
  @Prop({type: Object, required: true}) readonly allFilter!: ChecklistFilter;
  @Prop({type: String, required: true}) readonly fileFilter!: FileID;
  @Prop({type: Boolean, required: true}) readonly shortIdEnabled!: boolean;
  @Prop({type: Array, required: true}) readonly rules!: ChecklistVuln[];
  @Prop({type: Number, required: true}) readonly numTotalRules!: number;

  shortRuleId(ruleId: string) {
    return this.shortIdEnabled ? ruleId.split('r')[0] || ruleId : ruleId;
  }

  shortStigId(stigId: string) {
    return this.shortIdEnabled
      ? stigId.split('-').slice(0, 2).join('-')
      : stigId;
  }

  shortStatus(status: string) {
    if (this.shortIdEnabled) {
      switch (status) {
        case 'Not Reviewed':
          return 'NR';
        case 'Failed':
          return 'F';
        case 'Passed':
          return 'P';
        case 'Not Applicable':
          return 'NA';
      }
    }
    return status;
  }

  statusColor(status: ControlStatus) {
    switch (status) {
      case 'Passed':
        return 'statusPassed';
      case 'Not Applicable':
        return 'statusNotApplicable';
      case 'Failed':
        return 'statusFailed';
      default: // Not_Reviewed
        return 'statusNotReviewed';
    }
  }

  tableItems: ChecklistVuln[] = [];
  numItems = 0;
  getFiltered(rules: ChecklistVuln[]) {
    this.tableItems = rules;
    this.numItems = this.tableItems.length;
  }

  showRule(rule: ChecklistVuln) {
    FilteredDataModule.selectRule(rule);
  }

  checkSelected(rule: ChecklistVuln) {
    if (rule.ruleid === FilteredDataModule.selectedRule.ruleid) {
      return 'selectedRow';
    }
  }

  get headers() {
    return this.headersList.filter((header) => {
      return _.find(this.selectedHeaders, {text: header.text});
    });
  }

  selectedHeaders: {text: string; value: string; width?: string}[] = [
    {text: 'Status', value: 'status', width: '100px'},
    {text: 'STIG ID', value: 'ruleversion', width: '170px'},
    {text: 'Rule ID', value: 'ruleid', width: '170px'},
    {text: 'Vul ID', value: 'vulnnum', width: '100px'},
    {text: 'Group Name', value: 'grouptitle', width: '150px'},
    {text: 'CCIs', value: 'cciref', width: '120px'}
  ];

  headersList = [
    {text: 'Status', value: 'status', width: '100px'},
    {text: 'STIG ID', value: 'ruleversion', width: '170px'},
    {text: 'Rule ID', value: 'ruleid', width: '170px'},
    {text: 'Vul ID', value: 'vulnnum', width: '100px'},
    {text: 'Group Name', value: 'grouptitle', width: '150px'},
    {text: 'CCIs', value: 'cciref', width: '120px'}
  ];
}
</script>

<style scoped>
.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.short-id-container {
  width: fit-content;
}

.short-id-switch {
  margin-top: 0;
  padding-top: 0;
}
</style>
