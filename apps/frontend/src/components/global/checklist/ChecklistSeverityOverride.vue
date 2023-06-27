<template>
  <v-card class="text-center px-8 pt-2">
    <v-card-title class="justify-center"
      >Severity Override Justification</v-card-title
    >
    <v-card-subtitle class="justify-center mt-1">
      Please input a valid severity override justification. (Required)
    </v-card-subtitle>
    <v-textarea
      v-model="newJustification"
      class="mt-2"
      solo
      outlined
      dense
      auto-grow
      rows="3"
    />
    <v-row justify="center" class="mx-auto pb-5">
      <v-btn class="mr-5" color="#616161" dark @click="cancelSeverityOverride"
        >Cancel</v-btn
      >
      <v-btn color="#616161" dark @click="validateSecurityJustification">
        Override
      </v-btn>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import {ChecklistVuln, ChecklistSeverity} from '@mitre/hdf-converters';
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component
export default class ChecklistSeverityOverride extends Vue {
  @Prop({type: Object, required: true}) readonly selectedRule!: ChecklistVuln;
  @Prop({type: Boolean, required: true}) sheet!: boolean;
  @Prop({type: String, required: true})
  severityoverrideSelection!: ChecklistSeverity;

  newJustification = this.selectedRule.severityjustification
    ? this.selectedRule.severityjustification
    : '';

  validJustification = true;
  validateSecurityJustification() {
    if (this.newJustification !== '') {
      this.validJustification = true;
      this.selectedRule.severityoverride = this.severityoverrideSelection;
      this.selectedRule.severityjustification = this.newJustification;
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
    this.selectedRule.severityjustification = '';
  }
}
</script>
