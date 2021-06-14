<template>
  <v-dialog v-model="showingModal">
    <template #activator="{on}">
      <LinkItem
        key="export_csv"
        text="Export as CSV"
        icon="mdi-file-delimited"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Export as CSV </v-card-title>
      <v-card-text>
        <v-select
          v-model="fieldsToAdd"
          :items="fields"
          :menu-props="{maxHeight: '400'}"
          label="Select"
          multiple
          hint="Pick the fields to export"
          persistent-hint
        />
        <v-data-table :headers="headers" :items="rows" :items-per-page="4"
          ><template #[`item.Title`]="{item}">{{
            truncate(item.Title)
          }}</template>
          <template #[`item.Message`]="{item}">{{
            truncate(item.Message)
          }}</template>
          <template #[`item.Description`]="{item}">{{
            truncate(item.Description)
          }}</template>
          <template #[`item.Descriptions`]="{item}">{{
            truncate(item.Descriptions)
          }}</template>
          <template #[`item.Code`]="{item}">{{
            truncate(item.Code.replace(/=/g, ''))
          }}</template>
          <template #[`item.Check`]="{item}">{{
            truncate(item.Check)
          }}</template>
          <template #[`item.Fix`]="{item}">{{ truncate(item.Fix) }}</template>
          <template #[`item.Segments`]="{item}">{{
            truncate(item.Segments)
          }}</template>
        </v-data-table>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Cancel </v-btn>
        <v-btn color="primary" text @click="exportCSV"> Export </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {saveAs} from 'file-saver';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';

import {Filter, FilteredDataModule} from '@/store/data_filters';
import {ZipFile} from 'yazl';
import ObjectsToCsv from 'objects-to-csv';
import {HDFControlSegment} from 'inspecjs';
import {ContextualizedControl} from 'inspecjs/dist/context';
import {EvaluationFile, ProfileFile} from '../../store/report_intake';
import {Prop} from 'vue-property-decorator';
import {InspecDataModule} from '../../store/data_store';
import {ControlDescription} from 'inspecjs/dist/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import concat from 'concat-stream';


const fieldNames: {[key: string]: string} = {
  resultsSet: 'Results Set',
  status: 'Status',
  id: 'ID',
  title: 'Title',
  description: 'Description',
  descriptions: 'Descriptions',
  message: 'Message',
  impact: 'Impact',
  severity: 'Severity',
  code: 'Code',
  check: 'Check',
  fix: 'Fix',
  nistIds: '800-53 Controls',
  cciIds: 'CCI IDs',
  segments: 'Segments',
  waived: 'Waived',
  waiverData: 'Waiver Data'
}


type ControlSetRow = {
  [key: string]: unknown;
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
export default class ExportCSVModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  showingModal = false;
  fields = Object.values(fieldNames);
  fieldsToAdd: string[] = Object.values(fieldNames);

  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.generateCSVPreview();
    this.showingModal = true;
  }

  get headers() {
    return this.fieldsToAdd.map((field) => {
      return {text: field, sortable: false, value: field}
    })
  }

  files: File[] = []
  rows: ControlSetRows = []

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
    let check = "";
    let fix = "";
    const result: ControlSetRow = {};

    if(control.data.tags.check) {
      check = control.data.tags.check;
    } else if (typeof control.data.descriptions === 'object') {
      const found = control.data.descriptions?.find((description: ControlDescription) => description.label.toLowerCase() === 'check')
      if(found) {
        check = found.data
      }
    }
    if(control.data.tags.fix) {
      fix = control.data.tags.fix;
    } else if (typeof control.data.descriptions === 'object') {
      const found = control.data.descriptions?.find((description: ControlDescription) => description.label.toLowerCase() === 'fix')
      if(found) {
        fix = found.data
      }
    }
    this.fieldsToAdd.forEach((field) => {
      switch(field) {
        // Resulst Set
        case fieldNames.resultsSet:
          result[fieldNames.resultsSet] = file.filename
          break;
        // Status
        case fieldNames.status:
          result[fieldNames.status] = control.hdf.status
          break;
        case fieldNames.id:
          result[fieldNames.id] = control.data.id
          break;
        case fieldNames.title:
          result[fieldNames.title] = control.data.title
          break;
        case fieldNames.description:
          result[fieldNames.description] = control.data.desc
          break;
        case fieldNames.descriptions:
          result[fieldNames.descriptions] = this.descriptionsToString(control.data.descriptions)
          break;
        case fieldNames.message:
          result[fieldNames.message] = control.hdf.message
          break;
        case fieldNames.impact:
          result[fieldNames.impact] = control.data.impact
          break;
        case fieldNames.severity:
          result[fieldNames.severity] = control.hdf.severity
          break;
        case fieldNames.code:
          result[fieldNames.code] = control.full_code
          break;
        case fieldNames.check:
          result[fieldNames.check] = check
          break;
        case fieldNames.fix:
          result[fieldNames.fix] = fix
          break;
        case fieldNames.nistIds:
          result[fieldNames.nistIds] = control.hdf.raw_nist_tags.join(', ')
          break;
        case fieldNames.cciIds:
          result[fieldNames.cciIds] = (control.data.tags.cci || []).join(', ')
          break;
        case fieldNames.segments:
          result[fieldNames.segments] = this.segmentsToString(control.hdf.segments)
          break;
        case fieldNames.waived:
          result[fieldNames.waived] = control.hdf.waived ? 'True' : 'False'
          break;
        case fieldNames.waiverData:
          result[fieldNames.waiverData] = JSON.stringify(_.get(control, 'hdf.wraps.waiver_data'))
          break;
      }
    })
    return result
  }

  convertRows(file: ProfileFile | EvaluationFile): ControlSetRows {
    const rows: ControlSetRows = [];
    const controls = FilteredDataModule.controls({...this.filter, fromFile: [file.unique_id]});
    for (const ctrl of controls) {
      rows.push(this.convertRow(file, ctrl));
    }
    return rows;
  }

  /**
   * Generates the CSV for our first file so the user can change what fields will be in the final export.
   */
  generateCSVPreview() {
    const file = InspecDataModule.allFiles.find(
        (f) => f.unique_id === this.filter.fromFile[0]
      );
    if (file){
      this.rows = this.convertRows(file);
    }
  }

  truncate(string: string): string {
    return _.truncate(string, {length: 100})
  }

  exportCSV() {
    this.files = [];
    // In case we have multiple files, make an array to store them
    this.filter.fromFile.forEach(async (fileId) => {
      let rows: ControlSetRows = [];
      const file = InspecDataModule.allFiles.find(
        (f) => f.unique_id === fileId
      );
      if(file) {
        // Convert all controls from a file to ControlSetRows
        rows = this.convertRows(file);
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
          this.files.push({
            filename: this.cleanUpFilename(`${file.filename}.csv`),
            data: csvString
          })
        }
        // If we have all of our files converted we can save them as a .zip file
        if(this.filter.fromFile.length !== 1 && this.files.length === this.filter.fromFile.length){
          const zipfile = new ZipFile();
          this.files.forEach((csvFile) => {
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
    this.closeModal();
  }
  cleanUpFilename(filename: string): string {
    return filename.replace(/\s+/g, '_');
  }
}
</script>
