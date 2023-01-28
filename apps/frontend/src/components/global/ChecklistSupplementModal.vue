<template>
  <Modal
    :visible="show"
    :max-width="'500px'"
    :persistent="true"
    @close-modal="show = false"
  >
    <v-card>
      <v-card-title> Checklist Detected</v-card-title>
      <v-card-text> How would you like to open {{ filename }} </v-card-text>
      <v-card-text>
        <v-row>
          <v-col>
            <v-radio-group v-if="multiple" v-model="importType">
              <v-card-text
                >{{ numberOfObj }} iSTIG objects found during
                evaluation</v-card-text
              >
              <v-spacer />
              <v-radio
                label="Separate HDF Files"
                value="split"
                @click="importType = 'split'"
              />
              <v-radio
                label="Create Wrapper"
                value="wrapper"
                @click="importType = 'wrapper'"
              />
            </v-radio-group>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions class="justify-space-between">
        <v-btn
          color="primary"
          text
          :disabled="
            importType == 'split' || importType == 'wrapper' ? false : true
          "
          @click="view"
        >
          View
        </v-btn>
        <v-btn color="primary" text :disabled="true" @click="view">
          Edit
        </v-btn>
        <v-btn text @click="show = false"> Cancel </v-btn>
      </v-card-actions>
    </v-card>
  </Modal>
</template>

<script lang="ts">
import Modal from '@/components/global/Modal.vue';
import {
  ChecklistResults,
  checklistSupplementalInfo
} from '@mitre/hdf-converters';
import {InspecIntakeModule} from '@/store/report_intake';
import {ChecklistSupplementalInfoModule} from '@/store/checklist_supplemental';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {Modal}
})
export default class ChecklistSupplementModal extends Vue {
  defaultMultipleOption: checklistSupplementalInfo['intakeType'] = 'split';
  get numberOfObj(): number {
    return ChecklistSupplementalInfoModule.numOfObj;
  }

  get importType(): checklistSupplementalInfo['intakeType'] {
    return ChecklistSupplementalInfoModule.intakeType;
  }

  set importType(type: checklistSupplementalInfo['intakeType']) {
    ChecklistSupplementalInfoModule.SET_INTAKE(type);
  }

  get show(): boolean {
    return ChecklistSupplementalInfoModule.visibility;
  }

  set show(visibility) {
    ChecklistSupplementalInfoModule.resetState();
    ChecklistSupplementalInfoModule.SET_SHOW(visibility);
  }

  get filename(): string {
    return ChecklistSupplementalInfoModule.filename;
  }

  get multiple(): boolean {
    return ChecklistSupplementalInfoModule.multiple;
  }

  async view(): Promise<void> {
    const checklistXml = ChecklistSupplementalInfoModule.xmlString;
    const checklistInfo = {
      filename: this.filename,
      intakeType: this.importType,
      mode: await ChecklistSupplementalInfoModule.mode
    };
    const results = new ChecklistResults(
      checklistXml,
      checklistInfo,
      false
    ).toHdf();
    if (Array.isArray(results)) {
      results.map((evaluation, index) => {
        InspecIntakeModule.loadExecJson({
          data: evaluation,
          filename: `${this.filename.replace(/\.ckl/gi, '')}-${index + 1}.ckl`
        });
      });
    } else if (results) {
      InspecIntakeModule.loadExecJson({
        data: results,
        filename: this.filename
      });
    }
    this.$emit('close-modal');
  }
}
</script>
