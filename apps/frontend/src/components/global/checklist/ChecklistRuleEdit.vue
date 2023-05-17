<template>
  <v-card width="100%" class="mt-3 pt-4">
    <v-card-text>
      <v-row dense>
        <v-col>
          <v-select
            v-model="selectedRule.status"
            dense
            label="Status"
            :items="statusItems"
            item-text="name"
            item-value="value"
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
      <v-row dense>
        <v-col>
          <strong>Finding Details: </strong><br />
          <v-textarea
            v-model="selectedRule.findingDetails"
            solo
            outlined
            dense
            auto-grow
          />
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          <strong>Comments: </strong>
          <v-textarea
            v-model="selectedRule.comments"
            solo
            outlined
            dense
            auto-grow
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
