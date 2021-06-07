<template>
  <v-tooltip top>
    <template #activator="{on}">
      <LinkItem
        key="export_csv"
        text="Export as CSV"
        icon="mdi-file-delimited"
        @click="exportCSV()"
        v-on="on"
      />
    </template>
    <span>CSV Download</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {saveAs} from 'file-saver';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';

import {Filter, FilteredDataModule} from '@/store/data_filters';
import {ZipFile} from 'yazl';
import ObjectsToCsv from 'objects-to-csv';
import {HDFControlSegment, Severity} from 'inspecjs';
import {ContextualizedControl} from 'inspecjs/dist/context';
import {EvaluationFile, ProfileFile} from '../../store/report_intake';
import {Prop} from 'vue-property-decorator';
import {InspecDataModule} from '../../store/data_store';
import {ControlDescription, WaiverData} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import concat from 'concat-stream';


type ControlSetRow = {
    resultsSet: string;
    status: string;
    id: string;
    title?: string | null;
    desc?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptions?: ControlDescription[] | { [key: string]: any; } | null,
    message: string,
    impact: number;
    severity: Severity;
    code: string;
    check?: string;
    fix: string;
    nist?: string[];
    cci?: string[];
    segments?: HDFControlSegment[];
    waived: boolean;
    waiver_data?: WaiverData;
}

type File = {
  filename: string;
  data: string;
}

type ControlSetRows = ControlSetRow[]

@Component({
  components: {
    LinkItem
  }
})
export default class ExportCSV extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  convertRow(file: ProfileFile | EvaluationFile, control: ContextualizedControl): ControlSetRow {
    return {
      resultsSet: file.filename,
      status: control.hdf.status,
      id: control.data.id,
      title: control.data.title,
      desc: control.data.desc,
      descriptions: control.data.descriptions,
      message: control.hdf.message,
      impact: control.data.impact,
      severity: control.hdf.severity,
      code: control.full_code,
      check: control.data.tags.check,
      fix: control.data.tags.fix,
      nist: control.hdf.raw_nist_tags,
      cci: control.data.tags.cci,
      segments: control.hdf.segments,
      waived: control.hdf.waived,
      waiver_data: _.get(control, 'hdf.wraps.waiver_data')
    }
  }

  convertRows(file: ProfileFile | EvaluationFile): ControlSetRows {
    const rows: ControlSetRows = [];
    const controls = FilteredDataModule.controls({...this.filter, fromFile: [file.unique_id]});
    const hitIds = new Set();
    for (const ctrl of controls) {
      const root = ctrl.root;
      if (hitIds.has(root.hdf.wraps.id)) {
          continue;
        } else {
          hitIds.add(root.hdf.wraps.id);
          rows.push(this.convertRow(file, root));
        }
    }
    return rows;
  }

  exportCSV() {
    // In case we have multiple files, make an array to store them
    const files: File[] = []
    this.filter.fromFile.forEach(async (fileId) => {
      const file = InspecDataModule.allFiles.find(
        (f) => f.unique_id === fileId
      );
      if(file) {
        // Convert all controls from a file to ControlSetRows
        const rows = this.convertRows(file);
        // Convert our rows to CSV
        const csvString = await new ObjectsToCsv(rows).toString()
        // If we only have one file we can save just one csv file
        if(this.filter.fromFile.length === 1) {
          const blob = new Blob([csvString], {
            type: 'application/csv'
          });
          saveAs(blob, this.cleanUpFilename(`${file.filename}.csv`));
        } else {
          // Otherwise add to our files list
          files.push({
            filename: this.cleanUpFilename(`${file.filename}.csv`),
            data: csvString
          })
        }
        // If we have all of our files converted we can save them as a .zip file
        if(this.filter.fromFile.length !== 1 && files.length === this.filter.fromFile.length){
          const zipfile = new ZipFile();
          files.forEach((csvFile) => {
            const buffer = Buffer.from(csvFile.data);
            zipfile.addBuffer(buffer, csvFile.filename);
          })
          zipfile.outputStream.pipe(
            concat({encoding: 'uint8array'}, (b: Uint8Array) => {
              saveAs(new Blob([b]), 'exported_csvs.zip');
            })
          );
          zipfile.end();
        }
      }
    })
  }
  cleanUpFilename(filename: string): string {
    return filename.replace(/\s+/g, '_');
  }
}
</script>
