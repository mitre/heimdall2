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
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {GenericFilter, FilteredDataModule} from '@/store/data_filters';
import {FromHDFToXCCDFMapper} from '@mitre/hdf-converters';
import axios from 'axios';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {saveSingleOrMultipleFiles} from '../../utilities/export_util';
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
  @Prop({type: Object, required: true}) readonly filter!: GenericFilter;
  @Prop({type: Boolean, required: true}) readonly isResultView!: boolean;
  //exports .zip of XCCDFs if multiple are selected, if one is selected it will export that single file
  exportXCCDF() {
    axios
      .get<string>(`/static/export/xccdfTemplate.xml`)
      .then(({data: template}) => {
        const convertedFiles: {
          filename: string;
          data: string;
        }[] = [];
        const ids = FilteredDataModule.selected_file_ids;
        for (const evaluation of FilteredDataModule.evaluations(ids)) {
          const convertedData = new FromHDFToXCCDFMapper(
            JSON.stringify(evaluation.data),
            template
          ).toXCCDF();
          convertedFiles.push({
            filename: evaluation.from_file.filename + '.xml',
            data: convertedData
          });
        }

        for (const profile of FilteredDataModule.profiles(ids)) {
          const convertedData = new FromHDFToXCCDFMapper(
            JSON.stringify({profiles: [profile.data]}),
            template
          ).toXCCDF();
          convertedFiles.push({
            filename: profile.from_file.filename + '.xml',
            data: convertedData
          });
        }

        saveSingleOrMultipleFiles(convertedFiles, 'xccdf');
      });
  }
}
</script>
