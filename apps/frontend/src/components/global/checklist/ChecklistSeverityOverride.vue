<template>
  <v-card class="text-center px-8 pt-2">
    <v-card-title class="justify-center"
      >Severity Override Justification</v-card-title
    >
    <v-card-subtitle
      v-if="selectedRule.severityJustification === ''"
      class="justify-center mt-1"
    >
      <strong>
        Please input a valid severity override justification. (Required)
      </strong>
    </v-card-subtitle>
    <v-card-subtitle v-else class="justify-center mt-1">
      <strong>Press "OK" to save.</strong>
    </v-card-subtitle>
    <v-textarea
      v-model="selectedRule.severityJustification"
      class="mt-2"
      solo
      outlined
      dense
      no-resize
      height="130px"
    />
    <v-btn color="#616161" dark @click="cancelSeverityOverride"> Cancel </v-btn>
    <v-btn
      class="ml-4"
      color="#616161"
      dark
      @click="validateSecurityJustification"
    >
      Ok
    </v-btn>
  </v-card>
</template>

<script lang="ts">
import {ChecklistVuln} from '@mitre/hdf-converters';
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component
export default class ChecklistSeverityOverride extends Vue {
  @Prop({type: Object, required: true}) readonly selectedRule!: ChecklistVuln;
  @Prop({type: Boolean, required: true}) sheet!: Boolean;

  validJustification = true;
  validateSecurityJustification() {
    if (this.selectedRule.severityJustification !== '') {
      this.validJustification = true;
      this.$emit('disable-sheet');
      return true;
    } else {
      this.validJustification = false;
      this.$emit('enable-sheet');
      return false;
    }
  }

  cancelSeverityOverride() {
    this.validJustification = true;
    this.$emit('disable-sheet');
    // TODO: Currently this is a v-model so if canceled it will clear previous input
    this.selectedRule.severityOverride = '';
    this.selectedRule.severityJustification = '';
  }
}
</script>
