<template>
  <v-tooltip top>
    <template #activator="{on}">
      <IconLinkItem
        key="export_json"
        text="Export as OHDF JSON"
        icon="mdi-code-json"
        @click="export_json()"
        v-on="on"
      />
    </template>
    <span>JSON Download</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import { AnnotationModule } from '@/store/annotation_store';
import { FilteredDataModule } from '@/store/data_filters';
import { InspecDataModule } from '@/store/data_store';
import { SnackbarModule } from '@/store/snackbar';
import { cleanUpFilename, saveSingleOrMultipleFiles } from '@/utilities/export_util';

export type FileData = {
  data: string;
  filename: string;
};

@Component({ components: { IconLinkItem } })
export default class ExportJSON extends Vue {
  cleanup_filename(filename: string): string {
    return cleanUpFilename(filename, '.json');
  }

  async export_json() {
    const ids = FilteredDataModule.selected_file_ids;
    const files = await this.populate_files();
    saveSingleOrMultipleFiles(files, 'json')
      .then(() => {
        InspecDataModule.markFileSaved(ids);
      })
      .catch((error) => {
        SnackbarModule.failure(`Export failed: ${error.message || error}`);
      });
  }

  async populate_files(): Promise<FileData[]> {
    const ids = FilteredDataModule.selected_file_ids;
    const fileData: FileData[] = [];
    for (const evaluation of FilteredDataModule.evaluations(ids)) {
      const fileId = evaluation.from_file.uniqueId;
      const clone = await AnnotationModule.applyAttestationsToHdf({ fileId });
      fileData.push({
        data: JSON.stringify(clone ?? evaluation.data),
        filename: this.cleanup_filename(evaluation.from_file.filename),
      });
    }
    for (const prof of FilteredDataModule.profiles(ids)) {
      fileData.push({
        data: JSON.stringify(prof.from_file.profile.data),
        filename: prof.from_file.filename,
      });
    }
    return fileData;
  }
}
</script>
