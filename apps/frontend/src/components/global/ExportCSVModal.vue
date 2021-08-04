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
          label="Select Fields"
          dense
          multiple
          hint="Pick the fields to export"
        />
        <v-data-table :headers="headers" :items="rows" :items-per-page="5"
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
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';

import {Filter, FilteredDataModule} from '@/store/data_filters';
import ObjectsToCsv from 'objects-to-csv';
import {EvaluationFile, ProfileFile} from '../../store/report_intake';
import {Prop} from 'vue-property-decorator';
import {InspecDataModule} from '../../store/data_store';
import _ from 'lodash';
import {saveSingleOrMultipleFiles} from '@/utilities/export_util'
import {HDFControlSegment, ContextualizedControl, ExecJSON} from 'inspecjs';


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

  descriptionsToString(descriptions?: ExecJSON.ControlDescription[] | { [key: string]: unknown; } | null): string {
    let result = '';
      if(Array.isArray(descriptions)) {
      descriptions.forEach((description: ExecJSON.ControlDescription) => {
        result += `${description.label}: ${description.data}\r\n\r\n`
      })
    }
    return result
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
      const found = control.data.descriptions?.find((description: ExecJSON.ControlDescription) => description.label.toLowerCase() === 'check')
      if(found) {
        check = found.data
      }
    }
    if(control.data.tags.fix) {
      fix = control.data.tags.fix;
    } else if (typeof control.data.descriptions === 'object') {
      const found = control.data.descriptions?.find((description: ExecJSON.ControlDescription) => description.label.toLowerCase() === 'fix')
      if(found) {
        fix = found.data
      }
    }
    this.fieldsToAdd.forEach((field) => {
      switch(field) {
        case fieldNames.resultsSet:
          result[fieldNames.resultsSet] = file.filename
          break;
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
          result[fieldNames.nistIds] = control.hdf.rawNistTags.join(', ')
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
    const controls = FilteredDataModule.controls({...this.filter, fromFile: [file.uniqueId]});
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
        (f) => f.uniqueId === this.filter.fromFile[0]
      );
    if (file){
      this.rows = this.convertRows(file);
    }
  }

  truncate(string: string): string {
    return _.truncate(string, {length: 100})
  }

  async convertData(file: EvaluationFile | ProfileFile) {
    // Convert all controls from a file to ControlSetRows
      let rows: ControlSetRows = [];
      rows = this.convertRows(file);
        // Convert our rows to CSV
        const csvString = await new ObjectsToCsv(rows).toString()
        // If we only have one file we can save just one csv file
        this.files.push({
          filename: this.cleanUpFilename(`${file.filename}.csv`),
          data: csvString
        })
  }

  exportCSV() {
    this.files = [];
    const fileConvertPromises = this.filter.fromFile.map((fileId) => {
      const file = InspecDataModule.allFiles.find(
        (f) => f.uniqueId === fileId
      );
      if(file) {
        return this.convertData(file)
      }
      return null;
    })
    Promise.all(fileConvertPromises).then(() => saveSingleOrMultipleFiles(this.files, 'csv')).finally(() => {
      this.closeModal();
    })
  }

  cleanUpFilename(filename: string): string {
    return filename.replace(/\s+/g, '_');
  }
}
</script>
