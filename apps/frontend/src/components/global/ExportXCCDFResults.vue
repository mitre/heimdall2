<template>
  <v-tooltip top>
    <template #activator="{on}">
      <IconLinkItem
        key="export_xccdf"
        :text="isResultView ? 'Export as XCCDF Results' : 'Export as XCCDF'"
        icon="mdi-xml"
        @click="exportXCCDF()"
        v-on="on"
      />
    </template>
    <span>Export as XCCDF</span>
  </v-tooltip>
</template>

<script lang="ts">
import { FromHDFToXCCDFMapper } from '@mitre/hdf-converters';
import axios from 'axios';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import { AnnotationModule } from '@/store/annotation_store';
import type { Filter } from '@/store/data_filters';
import { FilteredDataModule } from '@/store/data_filters';
import { InspecDataModule } from '@/store/data_store';
import { SnackbarModule } from '@/store/snackbar';
import { cleanUpFilename, saveSingleOrMultipleFiles } from '../../utilities/export_util';
export type FileData = {
  data: string;
  filename: string;
};
@Component({ components: { IconLinkItem } })
export default class ExportXCCDF extends Vue {
  @Prop({ required: true, type: Object }) readonly filter!: Filter;
  @Prop({ required: true, type: Boolean }) readonly isResultView!: boolean;
  // exports .zip of XCCDFs if multiple are selected, if one is selected it will export that single file
  async exportXCCDF() {
    const { data: template } = await axios.get<string>(
      '/static/export/xccdfTemplate.xml',
    );
    const convertedFiles: { data: string; filename: string }[] = [];
    const ids = FilteredDataModule.selected_file_ids;

    for (const evaluation of FilteredDataModule.evaluations(ids)) {
      const fileId = evaluation.from_file.uniqueId;
      const clone = await AnnotationModule.applyAttestationsToHdf({ fileId });
      const convertedData = new FromHDFToXCCDFMapper(
        JSON.stringify(clone ?? evaluation.data),
        template,
      ).toXCCDF();
      convertedFiles.push({
        data: convertedData,
        filename: cleanUpFilename(evaluation.from_file.filename, '.xml'),
      });
    }

    for (const profile of FilteredDataModule.profiles(ids)) {
      const convertedData = new FromHDFToXCCDFMapper(
        JSON.stringify({ profiles: [profile.data] }),
        template,
      ).toXCCDF();
      convertedFiles.push({
        data: convertedData,
        filename: cleanUpFilename(profile.from_file.filename, '.xml'),
      });
    }

    saveSingleOrMultipleFiles(convertedFiles, 'xccdf')
      .then(() => {
        InspecDataModule.markFileSaved(ids);
      })
      .catch((error) => {
        SnackbarModule.failure(`Export failed: ${error.message || error}`);
      });
  }
}
</script>
