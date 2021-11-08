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
        <v-text-field v-model="awsAccountId" label="AWS Account ID" />
        <v-text-field v-model="target" label="Target Name" />
        <v-text-field v-model="region" label="Region" />
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
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {saveSingleOrMultipleFiles} from '@/utilities/export_util';
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

  exportASFF() {
    const ids = FilteredDataModule.selected_file_ids;
    const fileData: FileData[] = [];
    FilteredDataModule.evaluations(ids).forEach(async (evaluation) => {
      const findings = new FromHdfToAsffMapper(evaluation.data, {
        input: evaluation.from_file.filename,
        awsAccountId: this.awsAccountId,
        target: this.target,
        region: this.region
      }).toAsff() as unknown as Record<string, unknown>[];
      this.sliceIntoChunks(findings, 100).forEach(async (chunk, index) => {
        fileData.push({
          filename: `${evaluation.from_file.filename}.p${index}.json`,
          data: JSON.stringify(chunk)
        });
      });
    });
    saveSingleOrMultipleFiles(fileData, 'ASFF').then(() => {
      // Preserve AWS Account ID and Region accross exports
      this.target = '';
      this.closeModal();
    });
  }
}
</script>
