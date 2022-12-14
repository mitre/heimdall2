<template>
  <Modal :visible="visible" @close-modal="$emit('close-modal')">
    <v-card>
      <h2 style="text-align: center; padding-top: 25px">
        Add/Update Target Data
      </h2>
      <div style="margin: 30px">
        <v-select
          v-model="selectedChecklistAsset.assettype"
          outlined
          dense
          :items="['Computing', 'Non-Computing']"
        />
        <v-text-field
          v-model="selectedChecklistAsset.marking"
          dense
          label="Marking"
        />
        <v-text-field
          v-model="selectedChecklistAsset.hostname"
          dense
          label="Host Name"
        />
        <v-text-field
          v-model="selectedChecklistAsset.hostip"
          dense
          label="IP Address"
        />
        <v-text-field
          v-model="selectedChecklistAsset.hostmac"
          dense
          label="MAC Address"
        />
        <v-text-field
          v-model="selectedChecklistAsset.hostfqdn"
          dense
          label="Fully Qualified Domain Name"
        />
        <v-text-field
          v-model="selectedChecklistAsset.targetcomment"
          dense
          label="Target Comments"
        />
        <br />
        <strong>Role</strong>
        <v-radio-group v-model="selectedChecklistAsset.role">
          <v-radio label="None" value="None" />
          <v-radio label="Workstation" value="Workstation" />
          <v-radio label="Member Server" value="Member Server" />
          <v-radio label="Domain Controller" value="Domain Controller" />
        </v-radio-group>
        <v-checkbox
          v-model="selectedChecklistAsset.webordatabase"
          label="Website or Database STIG"
          hide-details
        />
        <v-text-field
          v-if="selectedChecklistAsset.webordatabase"
          v-model="selectedChecklistAsset.webdbsite"
          label="Site"
        />
        <v-text-field
          v-if="selectedChecklistAsset.webordatabase"
          v-model="selectedChecklistAsset.webdbinstance"
          label="Instance"
        />
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
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    Modal
  }
})
export default class ChecklistTargetDataModal extends Vue {
  @Prop({default: true}) readonly visible!: boolean;

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID[] {
    return FilteredDataModule.selectedChecklistIds;
  }

  getChecklist(fileID: FileID[]) {
    return InspecDataModule.allChecklistFiles.find(
      (f) => f.uniqueId === fileID[0]
    );
  }

  get selectedChecklistAsset() {
    const selectedChecklist = this.getChecklist(this.file_filter);
    if (selectedChecklist) {
      return selectedChecklist.asset;
    } else {
      return FilteredDataModule.emptyAsset;
    }
  }
}
</script>
