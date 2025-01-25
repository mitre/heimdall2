<template>
  <v-card class="overflow-auto mt-3 pt-2" width="100%" height="730px">
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
        <div v-for="cci in selectedRule.cciRef.split('; ')" :key="cci">
          <span>{{ cci }}: {{ cciDescription(cci) }}</span>
          <div class="d-flex align-center">
            <span class="mr-2">NIST 800-53 Rev 5.1.1:</span>
            <v-chip :href="nistUrl(cci)" target="_blank" small>
              {{ nistDisplay(cci) || 'None' }}
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
        <div v-if="selectedRule.iaControls" class="my-3 d-flex flex-column">
          <span>IA Controls:</span>
          <span>{{ selectedRule.iaControls }}</span>
        </div>
        <!-- Rule False Positives -->
        <div v-if="selectedRule.falsePositives" class="my-3 d-flex flex-column">
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
import {is_control, NistControl, parse_nist} from 'inspecjs';

@Component
export default class ChecklistRuleInfoBody extends Vue {
  @Prop({type: Object, required: true}) readonly selectedRule!: ChecklistVuln;

  nistTag(cci: string): string {
    return CCI_DESCRIPTIONS[cci].nist.slice(-1)[0];
  }

  nistUrl(cci: string): string {
    const control = [this.nistTag(cci)].map(parse_nist).filter(is_control)[0];
    const url = control.canonize({
      pad_zeros: true,
      add_periods: false,
      add_spaces: false,
      max_specifiers: 2
    });
    const hash = this.urlAnchor(control);

    return (
      'https://csrc.nist.gov/projects/cprt/catalog#/cprt/framework/version/SP_800_53_5_1_1/home?element=' +
      url +
      hash
    );
  }

  urlAnchor(control: NistControl): string {
    const isAlphabetical = (anchor: string) => /[a-z]/.test(anchor);
    const isNumerical = (anchor: string) => /[0-9]/.test(anchor);

    const hash = control.subSpecifiers[2] || '';

    // Control Statement
    if (isAlphabetical(hash)) {
      // Convert 'a' to 0, 'b' to 1, etc.
      const statement = hash.toLowerCase().charCodeAt(0) - 97;
      return `#child0-${statement}`;
    }

    // Control Enhancement
    if (isNumerical(hash)) {
      const enhancement = control.canonize({
        pad_zeros: true,
        add_periods: false,
        add_spaces: false,
        add_parens: true,
        max_specifiers: 3
      });
      return `#${enhancement}`;
    }

    // While it is possible to grab the hash for a control like IA-5 (2) a. (1), the resulting hash would be #child0-0, but that would be the equivalent hash for IA-5 (a).

    return '';
  }

  nistDisplay(cci: string): string {
    const tag = [this.nistTag(cci)].map(parse_nist).filter(is_control)[0];
    const display = tag.canonize();
    return display;
  }

  cciDescription(cci: string): string {
    return CCI_DESCRIPTIONS[cci].def;
  }

  miscDataPresent() {
    return (
      this.selectedRule.iaControls ||
      this.selectedRule.falsePositives ||
      this.selectedRule.mitigations ||
      this.selectedRule.potentialImpact ||
      this.selectedRule.thirdPartyTools ||
      this.selectedRule.mitigationControl ||
      this.selectedRule.severityoverride ||
      this.selectedRule.severityjustification
    );
  }
}
</script>
