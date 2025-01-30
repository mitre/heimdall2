<template>
  <Modal :visible="visible" @close-modal="$emit('close-modal')">
    <v-card>
      <h2 class="modal-title">Add/Update Target Data</h2>
      <div class="input-section">
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
          placeholder="Examples: UNCLASSIFIED, FOUO, CUI"
        />
        <v-text-field
          v-model="selectedChecklistAsset.hostname"
          dense
          label="Host Name"
          placeholder="localhost"
        />
        <v-text-field
          v-model="selectedChecklistAsset.hostip"
          dense
          label="IP Address"
          placeholder="XXX.XXX.XXX.XXX"
        />
        <v-text-field
          v-model="selectedChecklistAsset.hostmac"
          dense
          label="MAC Address"
          placeholder="XX:XX:XX:XX:XX:XX"
        />
        <v-text-field
          v-model="selectedChecklistAsset.hostfqdn"
          dense
          label="Fully Qualified Domain Name"
          placeholder="https://www.exampledomain.com"
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
        <div class="d-flex flex-wrap">
          <v-checkbox
            v-model="selectedChecklistAsset.webordatabase"
            class="mr-5"
            label="Website or Database STIG"
            hide-details
            @change="clearTextInputs()"
          />
          <div class="flexed-inputs">
            <v-text-field
              v-model="selectedChecklistAsset.webdbsite"
              class="shrink input-width"
              label="Site"
              :disabled="!selectedChecklistAsset.webordatabase"
            />

            <v-text-field
              v-model="selectedChecklistAsset.webdbinstance"
              class="shrink input-width"
              label="Instance"
              :disabled="!selectedChecklistAsset.webordatabase"
            />
          </div>
        </div>
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
  get file_filter(): FileID {
    return FilteredDataModule.selectedChecklistId;
  }

  clearTextInputs() {
    this.selectedChecklistAsset.webdbsite = '';
    this.selectedChecklistAsset.webdbinstance = '';
  }

  get selectedChecklistAsset() {
    const selectedChecklist = InspecDataModule.getChecklist(this.file_filter);
    if (selectedChecklist) {
      return selectedChecklist.asset;
    } else {
      return FilteredDataModule.emptyAsset;
    }
  }
}
</script>

<style scoped>
.modal-title {
  text-align: center;
  padding-top: 25px;
}

.flexed-inputs {
  display: flex;
  justify-content: space-between;
  width: 75%;
  flex-wrap: wrap;
}

.input-section {
  margin: 30px;
}

.input-width {
  width: 400px;
}
</style>
