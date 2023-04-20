<template>
  <v-tooltip top>
    <template #activator="{on}">
      <IconLinkItem
        key="exportCaat"
        text="CAAT Spreadsheet"
        icon="mdi-file-excel"
        @click="exportCaat()"
        v-on="on"
      />
    </template>
    <span>Compliance Assessment Audit Tracking Data</span>
  </v-tooltip>
</template>

<script lang="ts">
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {s2ab} from '@/utilities/export_util';
import {saveAs} from 'file-saver';
import {FromHDFToCAATMapper} from '@mitre/hdf-converters';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {ControlsFilter, FilteredDataModule} from '../../store/data_filters';
import {InspecDataModule} from '../../store/data_store';
import {EvaluationFile} from '../../store/report_intake';

@Component({
  components: {
    IconLinkItem
  }
})
export default class ExportCaat extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: ControlsFilter;

  exportCaat() {
    const inputData = this.filter.fromFile.map((fileId: string) => {
      const file = (
        InspecDataModule.allEvaluationFiles as EvaluationFile[]
      ).find((f) => f.uniqueId === fileId);
      const data = file?.evaluation ?? '';
      const filename = file?.filename || fileId;
      const controls = FilteredDataModule.controls({
        ...this.filter,
        fromFile: [fileId]
      }).slice();
      return {data, filename, controls};
    });
    const caat = new FromHDFToCAATMapper(inputData).toCAAT(false);
    saveAs(
      new Blob([s2ab(caat)], {type: 'application/octet-stream'}),
      `CAAT-${FromHDFToCAATMapper.formatDate(new Date(), '-')}.xlsx`
    );
  }
}
</script>
