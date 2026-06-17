<template>
  <v-dialog v-model="showingModal" width="500px">
    <template #activator="{on}">
      <LinkItem
        key="export_csv"
        text="Export as ASFF"
        icon="mdi-file-document-multiple"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Export as ASFF </v-card-title>
      <v-card-text>
        <v-text-field v-model="awsAccountId" label="AWS Account ID">
          <v-tooltip slot="append" bottom>
            <template #activator="{on}">
              <v-icon dark v-on="on"> mdi-information-outline </v-icon>
            </template>
            <span
              >To find your Account ID, log into the AWS management console,<br />
              In navigation bar, click the dropdown containing your username<br />
              Your Account ID will be listed next to "My Account".
            </span>
          </v-tooltip>
        </v-text-field>

        <v-text-field v-model="target" label="Target Name">
          <v-tooltip slot="append" bottom>
            <template #activator="{on}">
              <v-icon dark v-on="on"> mdi-information-outline </v-icon>
            </template>
            <span
              >The target name is a user-defined string that is used to update
              existing controls in Security Hub.<br />
              If you upload a different results set of the same controls and
              using the same target name, the existing<br />
              findings in Security Hub will be updated.
            </span>
          </v-tooltip>
        </v-text-field>

        <v-text-field v-model="region" label="Region">
          <v-tooltip slot="append" bottom>
            <template #activator="{on}">
              <v-icon dark v-on="on" @click="openRegionDocumentation">
                mdi-information-outline
              </v-icon>
            </template>
            <span
              >Choose the region that contains the Security Hub instance you
              would like to upload findings to.<br />
              Click the <v-icon dense>mdi-information-outline</v-icon> icon to
              see a list of regions.
            </span>
          </v-tooltip>
        </v-text-field>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Cancel </v-btn>
        <v-btn
          color="primary"
          text
          :disabled="exportDisabled"
          @click="exportASFF"
        >
          Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {AnnotationModule} from '@/store/annotation_store';
import type {Filter} from '@/store/data_filters';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {SnackbarModule} from '@/store/snackbar';
import {cleanUpFilename, saveSingleOrMultipleFiles} from '@/utilities/export_util';
import {FromHdfToAsffMapper} from '@mitre/hdf-converters';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {FileData} from './ExportJson.vue';

@Component({
  components: {
    LinkItem
  }
})
export default class ExportASFFModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  files: File[] = [];
  showingModal = false;
  awsAccountId = '';
  target = '';
  region = '';

  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
  }

  get exportDisabled() {
    if (this.awsAccountId && this.target && this.region) {
      return false;
    } else {
      return true;
    }
  }

  openRegionDocumentation() {
    window.open(
      'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html'
    );
  }

  sliceIntoChunks(
    arr: Record<string, unknown>[],
    chunkSize: number
  ): Record<string, unknown>[][] {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
    }
    return res;
  }

  async exportASFF() {
    const ids = FilteredDataModule.selected_file_ids;
    const fileData: FileData[] = [];
    for (const evaluation of FilteredDataModule.evaluations(ids)) {
      const fileId = evaluation.from_file.uniqueId;
      const clone = await AnnotationModule.applyAttestationsToHdf({fileId});
      const findings = new FromHdfToAsffMapper(clone ?? evaluation.data, {
        input: evaluation.from_file.filename,
        awsAccountId: this.awsAccountId,
        target: this.target,
        region: this.region
      }).toAsff() as unknown as Record<string, unknown>[];
      for (const [index, chunk] of this.sliceIntoChunks(findings, 100).entries()) {
        fileData.push({
          filename: cleanUpFilename(`${evaluation.from_file.filename}.p${index}`, '.json'),
          data: JSON.stringify(chunk)
        });
      }
    }
    saveSingleOrMultipleFiles(fileData, 'ASFF')
      .then(() => {
        InspecDataModule.markFileSaved(ids);
        this.target = '';
        this.closeModal();
      })
      .catch((error) => {
        SnackbarModule.failure(`Export failed: ${error.message || error}`);
      });
  }
}
</script>
