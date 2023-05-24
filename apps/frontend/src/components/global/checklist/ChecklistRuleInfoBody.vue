<template>
  <v-card class="overflow-auto mt-3 pt-2" width="100%">
    <div v-if="selectedRule.ruleId !== ''">
      <v-card-text>
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
              <v-chip small>{{ nistTag(item)[2] || 'None' }}</v-chip>
            </div>
          </div>
        </div>
        <!-- Rule MISC Data -->
        <div class="my-3 d-flex flex-column">
          <span class="text-overline white--text">MISC Data: </span>
          <!-- Rule IA Controls -->
          <div v-if="selectedRule.iaControls" class="my-3 d-flex flex-column">
            <span>IA Controls:</span>
            <span>{{ selectedRule.iaControls }}</span>
          </div>
          <!-- Rule False Positives -->
          <div
            v-if="selectedRule.falsePositives"
            class="my-3 d-flex flex-column"
          >
            <span>False Positives:</span>
            <span>{{ selectedRule.falsePositives }}</span>
          </div>
          <!-- Rule Mitigations -->
          <div v-if="selectedRule.mitigations" class="my-3 d-flex flex-column">
            <span>Mitigations:</span>
            <span>{{ selectedRule.mitigations }}</span>
          </div>
          <!-- Rule Potential Impact -->
          <div
            v-if="selectedRule.potentialImpact"
            class="my-3 d-flex flex-column"
          >
            <span>Potential Impact:</span>
            <span>{{ selectedRule.potentialImpact }}</span>
          </div>
          <!-- Rule Third Party Tools -->
          <div
            v-if="selectedRule.thirdPartyTools"
            class="my-3 d-flex flex-column"
          >
            <span>Third Party Tools:</span>
            <span>{{ selectedRule.thirdPartyTools }}</span>
          </div>
          <!-- Rule Mitigation Control -->
          <div
            v-if="selectedRule.mitigationControl"
            class="my-3 d-flex flex-column"
          >
            <span>Mitigation Control:</span>
            <span>{{ selectedRule.mitigationControl }}</span>
          </div>
        </div>
      </v-card-text>
    </div>
    <div v-else>
      <v-card-text>No rule selected.</v-card-text>
    </div>
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

  cciDescription(cci: string): string {
    return CCI_DESCRIPTIONS[cci].def;
  }
}
</script>
