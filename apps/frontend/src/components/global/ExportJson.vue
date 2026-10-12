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
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {FilteredDataModule} from '@/store/data_filters';
import {saveSingleOrMultipleFiles} from '@/utilities/export_util';
import Vue from 'vue';
import Component from 'vue-class-component';

export interface FileData {
  filename: string;
  data: string;
}

@Component({
  components: {
    IconLinkItem
  }
})
export default class ExportJSON extends Vue {
  populate_files(): FileData[] {
    const ids = FilteredDataModule.selected_file_ids;
    const fileData: FileData[] = FilteredDataModule.evaluations(ids).map(
      (evaluation) => ({
        filename: this.cleanup_filename(evaluation.from_file.filename),
        data: JSON.stringify(evaluation.data)
      })
    );
    for (const prof of FilteredDataModule.profiles(ids)) {
      fileData.push({
        filename: prof.from_file.filename,
        data: JSON.stringify(prof.from_file.profile.data)
      });
    }
    return fileData;
  }

  // exports .zip of jsons if multiple are selected, if one is selected it will export that .json file
  async export_json(): Promise<void> {
    const files = this.populate_files();
    await saveSingleOrMultipleFiles(files, 'json');
  }

  cleanup_filename(filename: string): string {
    filename = filename.replaceAll(/\s+/gv, '_');
    // endsWith, not a substring compare: the old check took the last SIX
    // characters and compared them to the five-character '.json', so it
    // could never match and every export gained a second extension.
    if (!filename.endsWith('.json')) {
      filename += '.json';
    }
    return filename;
  }
}
</script>
