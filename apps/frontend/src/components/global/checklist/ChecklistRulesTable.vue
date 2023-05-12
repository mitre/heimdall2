<template>
  <v-card height="94vh" overflow-auto>
    <v-card-title class="pt-2">
      <div
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        "
      >
        <div>
          <strong>
            Rules ({{ numItems }} shown, {{ rules.length - numItems }} hidden)
          </strong>
        </div>
        <div style="width: fit-content">
          <v-switch
            input-value="true"
            style="margin-top: 0; padding-top: 0"
            dense
            inset
            label="Short ID"
            color="teal"
            hide-details
            @change="$emit('toggle-short-id')"
          />
        </div>
      </div>
      <v-spacer class="mt-0 pt-0" />
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
        height="8.5vh"
      >
        <template #selection="{item, index}">
          <div v-if="$vuetify.breakpoint.lgAndUp">
            <v-chip v-if="index < 4" small>
              <span>{{ item.text }}</span>
            </v-chip>
            <span v-if="index === 4" class="grey--text caption mt-0 pt-0">
              (+{{ selectedHeaders.length - 4 }} others)
            </span>
          </div>
          <div v-else>
            <v-chip v-if="index < 3" small>
              <span>{{ item.text }}</span>
            </v-chip>
            <span v-if="index === 3" class="grey--text caption ml-2">
              (+{{ selectedHeaders.length - 3 }} others)
            </span>
          </div>
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
        height="68vh"
        @current-items="getFiltered"
        @click:row="showRule"
      >
        <template #[`item.status`]="{item}">
          <v-chip :color="statusColor(item.status)" small
            ><strong>{{ shortStatus(item.status) }}</strong>
          </v-chip>
        </template>
        <template #[`item.ruleVersion`]="{item}">
          {{ truncate(shortStigId(item.ruleVersion), 20) }}
        </template>
        <template #[`item.ruleId`]="{item}">
          {{ truncate(shortRuleId(item.ruleId), 20) }}
        </template>
        <template #[`item.cciRef`]="{item}">
          {{ truncate(shortRuleId(item.cciRef), 15) }}
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {ChecklistFilter, FilteredDataModule} from '@/store/data_filters';
import {FileID} from '@/store/report_intake';
import {ChecklistVuln} from '@mitre/hdf-converters';
import {InspecDataModule} from '@/store/data_store';
import _ from 'lodash';
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component
export default class ChecklistRulesTable extends Vue {
  @Prop({type: Object, required: true}) readonly allFilter!: ChecklistFilter;
  @Prop({type: Array, required: true}) readonly fileFilter!: FileID[];
  @Prop({type: Boolean, required: true}) readonly shortIdEnabled!: boolean;
  @Prop({type: Array, required: true}) readonly rules!: ChecklistVuln[];

  shortRuleId(ruleId: string) {
    if (this.shortIdEnabled) return ruleId.split('r')[0] || ruleId;
    else return ruleId;
  }

  shortStigId(stigId: string) {
    if (this.shortIdEnabled) return stigId.split('-').slice(0, 2).join('-');
    else return stigId;
  }

  truncate(value: string, length: number, omission = '...') {
    return _.truncate(value, {omission: omission, length: length});
  }

  statusColor(status: string | undefined) {
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

  numStatus(status: string): string {
    return this.tableItems
      .filter((item) => item.status === status)
      .length.toString();
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

  numSeverity(severity: string): string {
    return this.tableItems
      .filter((item) => item.severity === severity.toLowerCase())
      .length.toString();
  }

  getChecklist(fileID: FileID[]) {
    return InspecDataModule.allChecklistFiles.find(
      (f) => f.uniqueId === fileID[0]
    );
  }

  showRule(rule: ChecklistVuln) {
    FilteredDataModule.selectRule(rule);
  }

  checkSelected(rule: ChecklistVuln) {
    if (rule.ruleId === FilteredDataModule.selectedRule.ruleId)
      return 'selectedRow';
  }

  get headers() {
    const selectedHeadersList = this.selectedHeaders.map(
      (header) => header.text
    );
    return [
      ...this.headersList.filter((header) =>
        selectedHeadersList.includes(header.text)
      ),
      ...this.hiddenRows
    ];
  }

  selectedHeaders: {text: string; value: string; width?: string}[] = [
    {text: 'Status', value: 'status', width: '100px'},
    {text: 'STIG ID', value: 'ruleVersion', width: '170px'},
    {text: 'Rule ID', value: 'ruleId', width: '170px'},
    {text: 'Vul ID', value: 'vulnNum', width: '100px'},
    {text: 'Group Name', value: 'groupTitle', width: '150px'},
    {text: 'CCIs', value: 'cciRef', width: '120px'}
  ];

  headersList = [
    {text: 'Status', value: 'status', width: '100px'},
    {text: 'STIG ID', value: 'ruleVersion', width: '170px'},
    {text: 'Rule ID', value: 'ruleId', width: '170px'},
    {text: 'Vul ID', value: 'vulnNum', width: '100px'},
    {text: 'Group Name', value: 'groupTitle', width: '150px'},
    {text: 'CCIs', value: 'cciRef', width: '120px'}
  ];

  /** Kept so we can filter by these values even though they are hidden */
  hiddenRows = [
    {value: 'severity', align: ' d-none'},
    {value: 'ruleTitle', align: ' d-none'},
    {value: 'vulnDiscuss', align: ' d-none'},
    {value: 'iaControls', align: ' d-none'},
    {value: 'checkContent', align: ' d-none'},
    {value: 'fixText', align: ' d-none'},
    {value: 'falsePositives', align: ' d-none'},
    {value: 'falseNegatives', align: ' d-none'},
    {value: 'documentable', align: ' d-none'},
    {value: 'mitigations', align: ' d-none'},
    {value: 'potentialImpact', align: ' d-none'},
    {value: 'thirdPartyTools', align: ' d-none'},
    {value: 'mitigationControl', align: ' d-none'},
    {value: 'responsibility', align: ' d-none'},
    {value: 'securityOverrideGuidance', align: ' d-none'},
    {value: 'checkContentRef', align: ' d-none'},
    {value: 'weight', align: ' d-none'},
    {value: 'class', align: ' d-none'},
    {value: 'stigRef', align: ' d-none'},
    {value: 'targetKey', align: ' d-none'},
    {value: 'stigUuid', align: ' d-none'},
    {value: 'legacyId', align: ' d-none'}
  ];
}
</script>
