<template>
  <Modal :visible="visible" @close-modal="$emit('close-modal')">
    <v-card>
      <h2 class="modal-title">Add/Update Technology Area</h2>
      <div class="input-section">
        <v-select
          v-model="selectedChecklistAsset.techarea"
          dense
          outlined
          :items="techAreaLabels"
          justify="center"
          label="Select a Technology Area (optional)"
        />
        <v-btn @click="clearSelection()">Clear Selection</v-btn>
      </div>
      <v-divider />
      <v-card-actions>
        <v-btn color="primary" text @click="$emit('close-modal')"
          >Close Window</v-btn
        >
      </v-card-actions>
    </v-card>
  </Modal>
</template>

<script lang="ts">
import Modal from '@/components/global/Modal.vue';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {FileID} from '@/store/report_intake';
import {Techarea} from '@mitre/hdf-converters';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    Modal
  }
})
export default class ChecklistTechnologyAreaModal extends Vue {
  @Prop({default: true}) readonly visible!: boolean;

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID {
    return FilteredDataModule.selectedChecklistId;
  }

  get selectedChecklistAsset() {
    const selectedChecklist = InspecDataModule.getChecklist(this.file_filter);
    if (selectedChecklist) {
      return selectedChecklist.asset;
    } else {
      return FilteredDataModule.emptyAsset;
    }
  }

  clearSelection() {
    this.selectedChecklistAsset.techarea = Techarea.Empty;
  }

  techAreaLabels: string[] = [
    'Application Review',
    'Boundary Security',
    'CDS Admin Review',
    'CDS Technical Review',
    'Database Review',
    'Domain Name System (DNS)',
    'Exchange Server',
    'Host Based System Security (HBSS)',
    'Internal Network',
    'Mobility',
    'Releasable Networks (REL)',
    'Traditional Security',
    'UNIX OS',
    'VVOIP Review',
    'Web Review',
    'Windows OS',
    'Other Review'
  ];
}
</script>

<style scoped>
.modal-title {
  text-align: center;
  padding-top: 25px;
}

.input-section {
  margin: 30px;
}
</style>
