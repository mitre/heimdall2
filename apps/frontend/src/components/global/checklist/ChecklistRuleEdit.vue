<template>
  <v-card class="mt-3 pt-4" height="42vh">
    <v-card-text>
      <v-row>
        <v-col>
          <v-select
            v-model="selectedRule.status"
            dense
            label="Status"
            :items="statusItems"
            item-text="name"
            item-value="value"
            :item-color="statusColor(selectedRule.status)"
          />
        </v-col>
        <v-col>
          <v-select
            v-model="selectedRule.severityOverride"
            dense
            label="Severity Override"
            item-text="name"
            item-value="value"
            :items="checkPossibleOverrides(selectedRule.severity)"
            @change="promptSeverityJustification"
          />
        </v-col>
      </v-row>
      <v-row class="mt-n8">
        <v-col>
          <strong>Finding Details: </strong><br />
          <v-textarea
            v-model="selectedRule.findingDetails"
            solo
            outlined
            dense
            no-resize
            height="12vh"
          />
        </v-col>
      </v-row>
      <v-row class="mt-n10">
        <v-col>
          <strong>Comments: </strong>
          <v-textarea
            v-model="selectedRule.comments"
            solo
            outlined
            dense
            no-resize
            height="8vh"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {ChecklistVuln} from '@mitre/hdf-converters';
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component
export default class ChecklistRuleInfoBody extends Vue {
  @Prop({type: Object, required: true}) selectedRule!: ChecklistVuln;
  @Prop({type: Boolean, required: true}) sheet!: Boolean;

  statusItems = [
    {name: 'Passed', value: 'Passed'},
    {name: 'Failed', value: 'Failed'},
    {name: 'Not Applicable', value: 'Not Applicable'},
    {name: 'Not Reviewed', value: 'Not Reviewed'}
  ];

  severityOverrideItems = [
    {name: 'High', value: 'high'},
    {name: 'Medium', value: 'medium'},
    {name: 'Low', value: 'low'},
    {name: '(Default)', value: ''}
  ];

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

  checkPossibleOverrides(severity: string) {
    return this.severityOverrideItems.filter((item) => item.value !== severity);
  }

  promptSeverityJustification() {
    if (this.selectedRule.severityOverride === '') {
      this.selectedRule.severityJustification =
        'Returning to default severity.';
    } else {
      this.selectedRule.severityJustification = '';
    }
    this.$emit('enable-sheet');
  }
}
</script>
