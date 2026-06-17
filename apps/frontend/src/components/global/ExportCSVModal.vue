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
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {AnnotationModule} from '@/store/annotation_store';
import type {Filter} from '@/store/data_filters';
import {FilteredDataModule} from '@/store/data_filters';
import {cleanUpFilename, saveSingleOrMultipleFiles} from '@/utilities/export_util';
import type {ContextualizedControl, HDFControlSegment} from 'inspecjs';
import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {InspecDataModule} from '../../store/data_store';
import type {EvaluationFile, ProfileFile} from '../../store/report_intake';
import {getDescription} from '../../utilities/helper_util';
import {stringify} from 'csv-stringify/sync';

const fieldNames = [
  'Results Set',
  'Status',
  'ID',
  'Title',
  'Description',
  'Descriptions',
  'Impact',
  'Severity',
  'Code',
  'Check',
  'Fix',
  '800-53 Controls',
  'CCI IDs',
  'Results',
  'Waived',
  'Waiver Data',
  'Attestation Status',
  'Attestation Explanation'
];

type ControlSetRow = {
  [key: string]: unknown;
};

type File = {
  filename: string;
  data: string;
};

type ControlSetRows = ControlSetRow[];

@Component({
  components: {
    LinkItem
  }
})
export default class ExportCSVModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  showingModal = false;
  fields = _.clone(fieldNames);
  fieldsToAdd: string[] = _.clone(fieldNames);

  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.generateCSVPreview();
    this.showingModal = true;
  }

  get headers() {
    return this.fieldsToAdd.map((field) => {
      return {text: field, sortable: false, value: field};
    });
  }

  files: File[] = [];
  rows: ControlSetRows = [];

  descriptionsToString(
    descriptions?:
      | ExecJSON.ControlDescription[]
      | {[key: string]: string}
      | null
  ): string {
    let result = '';
    if (Array.isArray(descriptions)) {
      // Caveats are the first thing displayed if defined
      // There should only ever be one, but better safe than sorry
      const caveats = descriptions.filter(
        (description) => description.label === 'caveat'
      );
      if (caveats.length) {
        descriptions = descriptions.filter(
          (description) => description.label !== 'caveat'
        );
        caveats.forEach((caveat) => {
          result += `${caveat.label}: ${caveat.data}`;
        });
      }
      descriptions.forEach((description: ExecJSON.ControlDescription) => {
        result += `${description.label}: ${description.data}\r\n\r\n`;
      });
    }
    return result;
  }

  segmentsToString(segments: HDFControlSegment[] | undefined): string {
    if (segments) {
      let result = '';
      segments.forEach((segment: HDFControlSegment) => {
        if (segment.message) {
          result += `${segment.status.toUpperCase()} -- Test: ${
            segment.code_desc
          }\r\nMessage: ${segment.message}\r\n\r\n`;
        } else {
          result += `${segment.status.toUpperCase()} -- Test: ${
            segment.code_desc
          }\r\n\r\n`;
        }
      });
      return result;
    } else {
      return '';
    }
  }

  createOverlaidCode(
    file: ProfileFile | EvaluationFile,
    control: ContextualizedControl
  ) {
    const controls = FilteredDataModule.controls({
      ...this.filter,
      ids: [control.data.id],
      fromFile: [file.uniqueId]
    });
    return controls[0].full_code;
  }

  convertRow(
    file: ProfileFile | EvaluationFile,
    control: ContextualizedControl
  ): ControlSetRow {
    let check = '';
    let fix = '';
    const result: ControlSetRow = {};

    if (control.data.tags.check) {
      check = control.data.tags.check;
    } else if (control.data.descriptions) {
      check = getDescription(control.data.descriptions, 'check') || '';
    }
    if (control.data.tags.fix) {
      fix = control.data.tags.fix;
    } else if (control.data.descriptions) {
      fix = getDescription(control.data.descriptions, 'fix') || '';
    }

    const attestation = AnnotationModule.hasAttestation(
      file.uniqueId,
      control.data.id
    )
      ? AnnotationModule.attestationsForFile(file.uniqueId).find(
          (a) => a.control_id === control.data.id
        )
      : undefined;

    this.fieldsToAdd.forEach((field) => {
      switch (field) {
        case fieldNames[0]:
          result[fieldNames[0]] = file.filename;
          break;
        case fieldNames[1]:
          result[fieldNames[1]] = control.hdf.status;
          break;
        case fieldNames[2]:
          result[fieldNames[2]] = control.data.id;
          break;
        case fieldNames[3]:
          result[fieldNames[3]] = control.data.title;
          break;
        case fieldNames[4]:
          result[fieldNames[4]] = control.data.desc;
          break;
        case fieldNames[5]:
          result[fieldNames[5]] = this.descriptionsToString(
            control.data.descriptions
          );
          break;
        case fieldNames[6]:
          result[fieldNames[6]] = control.data.impact;
          break;
        case fieldNames[7]:
          result[fieldNames[7]] = control.hdf.severity;
          break;
        case fieldNames[8]:
          result[fieldNames[8]] = this.createOverlaidCode(file, control);
          break;
        case fieldNames[9]:
          result[fieldNames[9]] = check;
          break;
        case fieldNames[10]:
          result[fieldNames[10]] = fix;
          break;
        case fieldNames[11]:
          result[fieldNames[11]] = control.hdf.rawNistTags.join(', ');
          break;
        case fieldNames[12]:
          result[fieldNames[12]] = (control.data.tags.cci || []).join(', ');
          break;
        case fieldNames[13]:
          result[fieldNames[13]] = this.segmentsToString(control.hdf.segments);
          break;
        case fieldNames[14]:
          result[fieldNames[14]] = control.hdf.waived ? 'True' : 'False';
          break;
        case fieldNames[15]:
          result[fieldNames[15]] = JSON.stringify(
            _.get(control, 'hdf.wraps.waiver_data')
          );
          break;
        case fieldNames[16]:
          result[fieldNames[16]] = attestation?.status ?? '';
          break;
        case fieldNames[17]:
          result[fieldNames[17]] = attestation?.explanation ?? '';
          break;
      }
    });
    return result;
  }

  convertRows(file: ProfileFile | EvaluationFile): ControlSetRows {
    const rows: ControlSetRows = [];
    const controls = FilteredDataModule.controls({
      ...this.filter,
      fromFile: [file.uniqueId]
    });
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

  /**
   * Generates the CSV for our first file so the user can change what fields will be in the final export.
   */
  generateCSVPreview() {
    const file = InspecDataModule.allFiles.find(
      (f) => f.uniqueId === this.filter.fromFile[0]
    );
    if (file) {
      this.rows = this.convertRows(file);
    }
  }

  truncate(string: string): string {
    return _.truncate(string, {length: 100});
  }

  async convertData(file: EvaluationFile | ProfileFile) {
    // Convert all controls from a file to ControlSetRows
    let rows: ControlSetRows = [];
    rows = this.convertRows(file);
    // Convert rows to CSV
    const csvBody = stringify(rows);
    // Generate headers for CSV
    const csvHeader = stringify([Object.keys(rows[0])]);
    // Merge CSV headers and body
    const csv = [csvHeader, csvBody].join('');
    // If we only have one file we can save just one csv file
    this.files.push({
      filename: cleanUpFilename(file.filename, '.csv'),
      data: csv
    });
  }

  exportCSV() {
    this.files = [];
    const fileConvertPromises = this.filter.fromFile.map((fileId) => {
      const file = InspecDataModule.allFiles.find((f) => f.uniqueId === fileId);
      if (file) {
        return this.convertData(file);
      }
      return null;
    });
    Promise.all(fileConvertPromises)
      .then(() => saveSingleOrMultipleFiles(this.files, 'csv'))
      .finally(() => {
        this.closeModal();
      });
  }

}
</script>
