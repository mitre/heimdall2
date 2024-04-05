<template>
  <v-card width="100%" height="120px" class="overflow-y-auto">
    <v-card-text v-if="selectedRule.stigref !== ''" class="text-center">
      <h3 class="d-inline-block mx-2 mw-100">
        {{ selectedRule.stigref }}
      </h3>
      <v-row dense class="mt-n2 mt-xl-3">
        <v-col :cols="4">
          <div>
            <span class="text-overline white--text">Vul ID: </span>
            {{ selectedRule.vulnnum }}
          </div>
        </v-col>
        <v-col :cols="4">
          <div>
            <span class="text-overline white--text">Rule ID: </span>
            {{ shortRuleId(selectedRule.ruleid) }}
          </div>
        </v-col>
        <v-col :cols="4">
          <div>
            <span class="text-overline white--text">STIG ID: </span>
            {{ shortStigId(selectedRule.ruleversion) }}
          </div>
        </v-col>
      </v-row>
      <v-row dense class="mt-n2 mt-xl-2">
        <v-col :cols="4">
          <div>
            <span class="text-overline white--text">Severity: </span
            >{{ selectedRule.severity }}
          </div>
        </v-col>
        <v-col :cols="4">
          <div>
            <span class="text-overline white--text"> Classification: </span>
            {{ selectedRule.class }}
          </div>
        </v-col>
        <v-col :cols="4">
          <div>
            <span class="text-overline white--text">Legacy IDs: </span
            >{{ selectedRule.legacyid }}
          </div>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text v-else class="text-center">
      <span class="text-overline white--text">No checklist selected</span>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import {ChecklistVuln} from '@mitre/hdf-converters';
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component
export default class ChecklistRuleInfoHeader extends Vue {
  @Prop({type: Object, required: true}) readonly selectedRule!: ChecklistVuln;
  @Prop({type: Boolean, required: true}) readonly shortIdEnabled!: boolean;

  shortRuleId(ruleId: string) {
    return this.shortIdEnabled ? ruleId.split('r')[0] || ruleId : ruleId;
  }

  shortStigId(stigId: string) {
    return this.shortIdEnabled
      ? stigId.split('-').slice(0, 2).join('-')
      : stigId;
  }
}
</script>

<style scoped></style>
