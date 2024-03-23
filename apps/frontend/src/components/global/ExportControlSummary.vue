<template>
  <v-tooltip top>
    <template #activator="{on}">
      <IconLinkItem
        key="exportControlSummary"
        text="Control Summary"
        icon="mdi-file-code"
        @click="exportControlSummary()"
        v-on="on"
      />
    </template>
    <span>Summary by Test ID</span>
  </v-tooltip>
</template>

<script lang="ts">
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationFile} from '@/store/report_intake';
import {saveSingleOrMultipleFiles} from '@/utilities/export_util';
import {ControlSummaryMapper} from '@mitre/hdf-converters';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    IconLinkItem
  }
})
export default class ExportControlSummary extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  async exportControlSummary() {
    const inputData = this.filter.fromFile.map((fileId: string) => {
      const file = (
        InspecDataModule.allEvaluationFiles as EvaluationFile[]
      ).find((f) => f.uniqueId === fileId);
      const data = file?.evaluation ?? '';
      const filename = file?.filename || fileId;
      const controls =
        FilteredDataModule.controls({
          ...this.filter,
          fromFile: [fileId]
        }).slice() || undefined;
      return {data, filename, controls};
    });
    const controlSummary = new ControlSummaryMapper(
      inputData
    ).toControlSummary();
    saveSingleOrMultipleFiles(
      [
        {
          data: JSON.stringify(controlSummary, null, 2),
          filename: 'heimdall_summary_by_test_id.json'
        }
      ],
      'json'
    );
  }
}
</script>
