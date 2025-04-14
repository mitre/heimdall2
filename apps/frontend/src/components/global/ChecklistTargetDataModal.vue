<template>
  <Modal :visible="visible" @close-modal="handleClose()">
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
            label="Website (checked) or Database STIG"
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
        <v-btn color="primary" text @click="handleClose()">Close Window</v-btn>
      </v-card-actions>
    </v-card>
  </Modal>
</template>

<script lang="ts">
import Modal from '@/components/global/Modal.vue';
import {FilteredDataModule} from '@/store/data_filters';
import {ChecklistFile, InspecDataModule} from '@/store/data_store';
import {FileID} from '@/store/report_intake';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';

@Component({
  components: {
    Modal
  }
})
export default class ChecklistTargetDataModal extends Vue {
  @Prop({default: true}) readonly visible!: boolean;

  @Watch('selectedChecklist.asset.webdbsite')
  onWebDbSiteChange(newValue: string) {
    if (newValue) this.webdbsite = newValue;
  }

  @Watch('selectedChecklist.asset.webdbinstance')
  onWebDbInstanceChange(newValue: string) {
    if (newValue) this.webdbinstance = newValue;
  }

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID {
    return FilteredDataModule.selectedChecklistId;
  }

  selectedChecklist: ChecklistFile = InspecDataModule.getChecklist(
    this.file_filter
  );

  webdbsite: string = this.selectedChecklistAsset.webdbsite ?? '';
  webdbinstance: string = this.selectedChecklistAsset.webdbinstance ?? '';

  handleClose() {
    InspecDataModule.updateChecklistAsset({
      file: this.file_filter,
      asset: this.selectedChecklistAsset
    });
    this.$emit('close-modal');
  }

  clearTextInputs() {
    if (this.selectedChecklistAsset.webordatabase) {
      this.selectedChecklistAsset.webdbsite = this.webdbsite;
      this.selectedChecklistAsset.webdbinstance = this.webdbinstance;
    } else {
      this.selectedChecklistAsset.webdbsite = '';
      this.selectedChecklistAsset.webdbinstance = '';
    }
  }

  get selectedChecklistAsset() {
    if (this.selectedChecklist) {
      return this.selectedChecklist.asset;
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
