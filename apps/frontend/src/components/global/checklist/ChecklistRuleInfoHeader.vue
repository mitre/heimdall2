<template>
  <v-card width="100%" height="120px" class="overflow-y-auto">
    <v-card-text v-if="selectedRule.stigRef !== ''" class="text-center">
      <h3 class="d-inline-block mx-2 mw-100">
        {{ selectedRule.stigRef }}
      </h3>
      <v-row dense class="mt-n2 mt-xl-3">
        <v-col :cols="4">
          <div>
            <span class="text-overline white--text">Vul ID: </span>
            {{ selectedRule.vulnNum }}
          </div>
        </v-col>
        <v-col :cols="4">
          <div>
            <span class="text-overline white--text">Rule ID: </span>
            {{ selectedRule.ruleId }}
          </div>
        </v-col>
        <v-col :cols="4">
          <div>
            <span class="text-overline white--text">STIG ID: </span>
            {{ selectedRule.ruleVer }}
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
            >{{ selectedRule.legacyId }}
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
}
</script>

<style scoped />
