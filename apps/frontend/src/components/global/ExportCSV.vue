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
    'Results Set': string;
    'Status': string;
    'ID': string;
    'Title'?: string | null;
    'Description'?: string | null;
    'Descriptions'?: string,
    'Message': string,
    'Impact': number;
    'Severity': Severity;
    'Code': string;
    'Check'?: string;
    'Fix': string;
    '800-53 Controls'?: string;
    'CCI IDs'?: string;
    'Segments'?: string;
    'Waived': boolean;
    'Waiver Data'?: WaiverData;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptionsToString(descriptions?: ControlDescription[] | { [key: string]: any; } | null): string {
    if(descriptions) {
      let result = '';
      descriptions.forEach((description: ControlDescription) => {
        result = result.concat(`${description.label}: ${description.data}\r\n\r\n`)
      })
      return result
    }
    else {
      return ''
    }
  }

  segmentsToString(segments: HDFControlSegment[] | undefined): string {
    if (segments) {
      let result = '';
      segments.forEach((segment: HDFControlSegment) => {
        if(segment.message){
          result += `${segment.status.toUpperCase()} -- Test: ${segment.code_desc}\r\nMessage: ${segment.message}\r\n\r\n`
        } else {
          result += `${segment.status.toUpperCase()} -- Test: ${segment.code_desc}\r\n\r\n`
        }
      })
      return result
    } else {
      return '';
    }
  }

  convertRow(file: ProfileFile | EvaluationFile, control: ContextualizedControl): ControlSetRow {
    return {
      'Results Set': file.filename,
      'Status': control.hdf.status,
      'ID': control.data.id,
      'Title': control.data.title,
      'Description': control.data.desc,
      'Descriptions': this.descriptionsToString(control.data.descriptions),
      'Message': control.hdf.message,
      'Impact': control.data.impact,
      'Severity': control.hdf.severity,
      'Code': control.full_code,
      'Check': control.data.tags.check || control.data.descriptions?.find((description: ControlDescription) => description.label.toLowerCase() === 'check').data,
      'Fix': control.data.tags.fix || control.data.descriptions?.find((description: ControlDescription) => description.label.toLowerCase() === 'fix').data,
      '800-53 Controls': control.hdf.raw_nist_tags.join(', '),
      'CCI IDs': control.data.tags.cci.join(', '),
      'Segments': this.segmentsToString(control.hdf.segments),
      'Waived': control.hdf.waived,
      'Waiver Data': _.get(control, 'hdf.wraps.waiver_data')
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
