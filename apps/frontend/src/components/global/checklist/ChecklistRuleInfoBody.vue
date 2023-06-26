<template>
  <v-card class="overflow-auto mt-3 pt-2" width="100%">
    <v-card-text v-if="selectedRule.ruleId !== ''">
      <!-- Rule Title -->
      <div class="my-3 d-flex flex-column">
        <span class="text-overline white--text">Rule Title: </span>

        <span>{{ selectedRule.ruleTitle }}</span>
      </div>
      <!-- Rule Discussion -->
      <div class="my-3 d-flex flex-column">
        <span class="text-overline white--text">Discussion: </span>

        <span>{{ selectedRule.vulnDiscuss }}</span>
      </div>
      <!-- Rule Check Text -->
      <div class="my-3 d-flex flex-column">
        <span class="text-overline white--text">Check Text: </span>

        <span>{{ selectedRule.checkContent }}</span>
      </div>
      <!-- Rule Fix Text -->
      <div class="my-3 d-flex flex-column">
        <span class="text-overline white--text">Fix Text: </span>
        <span>{{ selectedRule.fixText }}</span>
      </div>
      <!-- Rule References -->
      <div class="my-3 d-flex flex-column">
        <span class="text-overline white--text">References: </span>
        <div v-for="item in selectedRule.cciRef.split('; ')" :key="item">
          {{ item }}: {{ cciDescription(item) }}
          <div>
            NIST 800-53 Rev 4:
            <v-chip :href="nistUrl(item)" target="_blank" small>
              {{ nistTag(item)[2] || 'None' }}
            </v-chip>
          </div>
        </div>
      </div>
      <!-- Rule MISC Data -->
      <div class="my-3 d-flex flex-column">
        <span v-if="miscDataPresent()" class="text-overline white--text"
          >MISC Data:
        </span>
        <!-- Rule IA Controls -->
        <div v-if="selectedRule.iacontrols" class="my-3 d-flex flex-column">
          <span>IA Controls:</span>
          <span>{{ selectedRule.iacontrols }}</span>
        </div>
        <!-- Rule False Positives -->
        <div v-if="selectedRule.falsepositives" class="my-3 d-flex flex-column">
          <span>False Positives:</span>
          <span>{{ selectedRule.falsepositives }}</span>
        </div>
        <!-- Rule Mitigations -->
        <div v-if="selectedRule.mitigations" class="my-3 d-flex flex-column">
          <span>Mitigations:</span>
          <span>{{ selectedRule.mitigations }}</span>
        </div>
        <!-- Rule Potential Impact -->
        <div
          v-if="selectedRule.potentialimpact"
          class="my-3 d-flex flex-column"
        >
          <span>Potential Impact:</span>
          <span>{{ selectedRule.potentialimpact }}</span>
        </div>
        <!-- Rule Third Party Tools -->
        <div
          v-if="selectedRule.thirdpartytools"
          class="my-3 d-flex flex-column"
        >
          <span>Third Party Tools:</span>
          <span>{{ selectedRule.thirdpartytools }}</span>
        </div>
        <!-- Rule Mitigation Control -->
        <div
          v-if="selectedRule.mitigationcontrol"
          class="my-3 d-flex flex-column"
        >
          <span>Mitigation Control:</span>
          <span>{{ selectedRule.mitigationcontrol }}</span>
        </div>
        <!-- Severity Override -->
        <div
          v-if="selectedRule.severityoverride"
          class="my-3 d-flex flex-column"
        >
          <span>Severity Override:</span>
          <span>{{ selectedRule.severityoverride }}</span>
        </div>
        <!-- Severity Override Justification -->
        <div
          v-if="selectedRule.severityjustification"
          class="my-3 d-flex flex-column"
        >
          <span>Severity Override Justification:</span>
          <span>{{ selectedRule.severityjustification }}</span>
          <v-btn class="mt-2" dark @click="$emit('enable-sheet')"
            >Edit Justification<v-icon data-cy="edit" title="Edit" class="ml-3">
              mdi-pencil
            </v-icon></v-btn
          >
        </div>
      </div>
    </v-card-text>
    <v-card-text v-else class="text-center">
      <span class="text-overline white--text">No rule selected</span>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {CCI_DESCRIPTIONS} from '@/utilities/cci_util';
import {ChecklistVuln} from '@mitre/hdf-converters';
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component
export default class ChecklistRuleInfoBody extends Vue {
  @Prop({type: Object, required: true}) readonly selectedRule!: ChecklistVuln;

  nistTag(cci: string): string[] {
    return CCI_DESCRIPTIONS[cci].nist;
  }

  nistUrl(nist: string): string {
    return (
      'https://csrc.nist.gov/Projects/risk-management/sp800-53-controls/release-search#/control?version=5.1&number=' +
      this.nistTag(nist)[2].split(' ')[0] +
      '#active-release-version'
    );
  }

  cciDescription(cci: string): string {
    return CCI_DESCRIPTIONS[cci].def;
  }

  miscDataPresent() {
    return (
      this.selectedRule.iacontrols ||
      this.selectedRule.falsepositives ||
      this.selectedRule.mitigations ||
      this.selectedRule.potentialimpact ||
      this.selectedRule.thirdpartytools ||
      this.selectedRule.mitigationcontrol ||
      this.selectedRule.severityoverride ||
      this.selectedRule.severityjustification
    );
  }
}
</script>
