<template>
  <v-card height="37vh" class="overflow-auto mt-3 pt-2">
    <div v-if="selectedRule.ruleId !== ''">
      <v-card-text>
        <div>
          <span class="text-overline white--text">Rule Title: </span>
        </div>
        {{ selectedRule.ruleTitle }}<br /><br />
        <div>
          <span class="text-overline white--text">Discussion: </span>
        </div>
        {{ selectedRule.vulnDiscuss }}<br /><br />
        <div>
          <span class="text-overline white--text">Check Text: </span>
        </div>
        {{ selectedRule.checkContent }}<br /><br />
        <div>
          <span class="text-overline white--text">Fix Text: </span>
        </div>
        {{ selectedRule.fixText }}<br /><br />
      </v-card-text>
      <v-card-subtitle class="text-center text-subtitle-2">
        References
      </v-card-subtitle>
      <v-divider />
      <v-card-text>
        <div v-for="item in selectedRule.cciRef.split('; ')" :key="item">
          {{ item }}: {{ cciDescription(item) }}
          <div>
            NIST 800-53 Rev 4:
            <v-chip small>{{ nistTag(item)[2] || 'None' }}</v-chip>
          </div>
          <br />
        </div>
        <br /><br />
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
import _ from 'lodash';
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
