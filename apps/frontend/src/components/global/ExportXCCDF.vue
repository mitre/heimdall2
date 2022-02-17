<template>
  <v-tooltip top>
    <template #activator="{on}">
      <IconLinkItem
        key="export_xccdf"
        text="Export as XCCDF"
        icon="mdi-xml"
        @click="exportXCCDF()"
        v-on="on"
      />
    </template>
    <span>Export as XCCDF</span>
  </v-tooltip>
</template>

<script lang="ts">
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {FromHDFToXCCDFMapper} from '@mitre/hdf-converters';
import axios from 'axios';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {
  ExportFile,
  saveSingleOrMultipleFiles
} from '../../utilities/export_util';

export type FileData = {
  filename: string;
  data: string;
};

@Component({
  components: {
    IconLinkItem
  }
})
export default class ExportXCCDF extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  //exports .zip of XCCDFs if multiple are selected, if one is selected it will export that single file
  exportXCCDF() {
    axios.get<string>(`/static/export/xccdfTemplate.xml`).then(({data}) => {
      const convertedFiles: ExportFile[] = [];
      const ids = FilteredDataModule.selected_file_ids;
      for (const evaluation of FilteredDataModule.evaluations(ids)) {
        const convertedData = new FromHDFToXCCDFMapper(
          evaluation,
          data
        ).toXCCDF();
        convertedFiles.push({
          filename: evaluation.from_file.filename + '.xml',
          data: convertedData
        });
      }
      for (const evaluation of FilteredDataModule.profiles(ids)) {
        const convertedData = new FromHDFToXCCDFMapper(
          evaluation,
          data
        ).toXCCDF();
        convertedFiles.push({
          filename: evaluation.from_file.filename + '.xml',
          data: convertedData
        });
      }
      saveSingleOrMultipleFiles(convertedFiles, 'xccdf');
    });
  }
}
</script>
