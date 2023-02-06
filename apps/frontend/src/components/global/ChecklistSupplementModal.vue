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
            <v-radio-group v-if="multiple" v-model="intakeType">
              <v-card-text
                >{{ numberOfObj }} iSTIG objects found during
                evaluation</v-card-text
              >
              <v-spacer />
              <v-radio
                label="Create Wrapper"
                value="wrapper"
                @click="intakeType = 'wrapper'"
              />
              <v-radio
                label="Separate HDF Files"
                value="split"
                @click="intakeType = 'split'"
              />
            </v-radio-group>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions class="justify-space-between">
        <v-btn color="primary" text :disabled="false" @click="view">
          View
        </v-btn>
        <v-tooltip bottom>
          <template #activator="{on}">
            <div v-on="on">
              <v-btn color="primary" text :disabled="true" @click="edit">
                Edit
              </v-btn>
            </div>
          </template>
          <span>Coming Soon!</span>
        </v-tooltip>
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
import RouteMixin from '@/mixins/RouteMixin';
import {InspecIntakeModule} from '@/store/report_intake';
import {ChecklistSupplementalInfoModule} from '@/store/checklist_supplemental';
import Component from 'vue-class-component';

@Component({
  components: {Modal}
})
export default class ChecklistSupplementModal extends RouteMixin {
  defaultMultipleOption: checklistSupplementalInfo['intakeType'] = 'split';
  get numberOfObj(): number {
    return ChecklistSupplementalInfoModule.numOfObj;
  }

  get intakeType(): checklistSupplementalInfo['intakeType'] {
    return ChecklistSupplementalInfoModule.intakeType;
  }

  set intakeType(type: checklistSupplementalInfo['intakeType']) {
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
    if (ChecklistSupplementalInfoModule.multiple) {
      ChecklistSupplementalInfoModule.SET_INTAKE('wrapper');
    }
    return ChecklistSupplementalInfoModule.multiple;
  }

  async view(): Promise<void> {
    await this.importChecklistAction();
    this.navigateWithNoErrors('/results');
  }

  async edit(): Promise<void> {
    await this.importChecklistAction();
    this.navigateWithNoErrors('/checklist');
  }

  async importChecklistAction(): Promise<void> {
    await this.createAndAddChecklist();
    ChecklistSupplementalInfoModule.resetState();
    ChecklistSupplementalInfoModule.close();
  }

  async createAndAddChecklist(): Promise<void> {
    const checklistXml = ChecklistSupplementalInfoModule.xmlString;
    const checklistInfo = {
      filename: this.filename,
      intakeType: this.intakeType,
      mode: await ChecklistSupplementalInfoModule.mode
    };
    const results = new ChecklistResults(
      checklistXml,
      checklistInfo,
      false
    ).toHdf();
    if (Array.isArray(results)) {
      results.forEach((evaluation, index) => {
        InspecIntakeModule.loadExecJson({
          data: evaluation,
          filename: `${this.filename.replace(/\.ckl/gi, '')}-${index + 1}.ckl`
        });
        // InspecIntakeModule.addChecklist({});
      });
    } else if (results) {
      InspecIntakeModule.loadExecJson({
        data: results,
        filename: this.filename
      });
      // InspecIntakeModule.addChecklist({});
    }
  }
}
</script>
