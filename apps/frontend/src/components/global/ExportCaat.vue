<template>
  <v-tooltip top>
    <template #activator="{on}">
      <LinkItem
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
import Vue from 'vue'
import XLSX from 'xlsx';
import Component from 'vue-class-component';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {HDFControlSegment} from 'inspecjs';
import {Filter, FilteredDataModule} from '../../store/data_filters';
import {Prop} from 'vue-property-decorator';
import {ContextualizedControl} from 'inspecjs/dist/context';
import _ from 'lodash';

type CAATRow = {
  [key: string]: string;
};
type ContextualizedControlImp = ContextualizedControl & {
  sourced_from: {
    from_file: {
      filename: string;
      unique_id: string;
    }
  }
}
type Files = {
  [key: string]: {
    filename: string;
    rows: CAATRow[]
  }
}

@Component({
  components: {
    LinkItem
  }
})
export default class ExportCaat extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  MAX_CELL_SIZE = 32000;

  header = [
      'Control Number', 'Finding Title', 'Date Identified', 'Finding ID', 'Information System or Program Name',
      'Repeat Findings', 'Repeat Finding Weakness ID', 'Finding Description', 'Weakness Description', 'Control Weakness Type',
      'Source', 'Assessment/Audit Company', 'Test Method', 'Test Objective', 'Test Result Description',
      'Test Result', 'Recommended Corrective Action(s)', 'Effect on Business', 'Likelihood', 'Impact'
    ]

  fileSettings = {
    Title: 'Compliance Assessment/Audit Tracking (CAAT) Spreadsheet',
    Subject: 'Assessment Data',
    Author: 'Heimdall',
    CreatedDate: new Date()
  }

  getRow(control: ContextualizedControlImp): CAATRow[] {
    const hdf = control.hdf;
    const allRows: CAATRow[] = [];
    for (const formatted of hdf.canonized_nist({
      max_specifiers: 3,
      pad_zeros: true,
      allow_letters: false,
      add_spaces: false
    })) {
      // Establish our row
      if (!formatted) {
        continue;
      }
      const row: CAATRow = {};
      row['Control Number'] = formatted
      row['Finding Title'] = 'Test ' + this.fix(hdf.wraps.id) + ' - ' + this.fix(hdf.wraps.title)

      if (hdf.start_time) {
        row['Date Identified'] = this.convertDate(new Date(hdf.start_time), '/')
      } else {
        row['Date Identified'] = '';
      }

      row['Finding ID'] = '';
      row['Information System or Program Name'] = '';
      row['Repeat Findings'] = '';
      row['Repeat Finding Weakness ID'] = '';
      row['Finding Description'] = this.fix(hdf.wraps.title)

      // Prepend the caveat to the Weakness Description if there is one
      let caveat = hdf.descriptions.caveat ? '(Caveat: ' + this.fix(hdf.descriptions.caveat) + ')\n' : '';
      row['Weakness Description'] = caveat + this.fix(hdf.wraps.desc);

      row['Control Weakness Type'] = 'Security';
      row['Source'] = 'Self-Assessment';
      row['Assessment/Audit Company'] = '';
      row['Test Method'] = 'Test';
      row['Test Objective'] = this.fix(hdf.descriptions.check || hdf.wraps.tags.check)

      // Get the result description of the test
      let testResult = `${hdf.status}:\r\n\r\n`;
      _.get(hdf, 'wraps.results').forEach((result: HDFControlSegment) => {
        if(result.message) {
          testResult += `${result.status.toUpperCase()} -- Test: ${result.code_desc}\r\nMessage: ${result.message}\r\n\r\n`
        } else {
          testResult += `${result.status.toUpperCase()} -- Test: ${result.code_desc}\r\n\r\n`
        }
      })
      row['Test Result Description'] = this.fix(testResult); // Test Result Description

      // Test Result
      if (hdf.status === 'Passed') {
        row['Test Result'] = 'Satisfied';
      } else {
        row['Test Result'] =  'Other Than Satisfied';
      }
      row['Recommended Corrective Action(s)'] = this.fix(hdf.descriptions.fix || hdf.wraps.tags.fix); // Recommended Corrective Action(s)
      row['Effect on Business'] = '';
      row['Likelihood'] = '';
      const controlSeverity = hdf.severity === 'medium' ? 'moderate' : hdf.severity
      row['Impact'] = this.fix(hdf.wraps.impact === 0 ? 'none' : controlSeverity); // Impact

      // if (row.length !== ((this.header.length - (this.header.length / 2)))) {
      //   console.log(row.length)
      //   console.log(this.header.length)
      //   throw new Error('Row of wrong size');
      // }
      allRows.push(row);
    }
    return allRows;
  }

  exportCaat() {
    // Create the workbook
    const wb = XLSX.utils.book_new();
    wb.Props = this.fileSettings;
    // Get all of our controls
    const controls = FilteredDataModule.controls(this.filter);
    const files: Files = {}

    // Gets list of files
    const foundFiles = new Set();
    for (const ctrl of controls) {
      const root = ctrl.root;
      const file = (root.sourced_from as unknown as ContextualizedControlImp).sourced_from?.from_file
      const fileId = file.unique_id
      if (foundFiles.has(fileId)) {
        continue;
      } else {
        foundFiles.add(fileId);
        files[fileId] = {
          'filename': file.filename,
          'rows': []
        }
      }
    }
    // Find controls for each file
    Object.keys(files).forEach((fileId: string): void => {
      wb.SheetNames.push(`${files[fileId].filename} - ${fileId}`.substr(0, 30));
      const hitIds = new Set();
      // Get controls from each file
      for (const ctrl of controls) {
        const root = (ctrl.root as unknown as ContextualizedControlImp);
        const ctrlFileId = (root.sourced_from as unknown as ContextualizedControlImp).sourced_from?.from_file.unique_id
        if (hitIds.has(root.hdf.wraps.id)) {
          continue;
        } else {
          if(ctrlFileId === fileId){
            hitIds.add(root.hdf.wraps.id);
            files[fileId].rows.push(...this.getRow(root));
          }
        }
      }
      const ws = XLSX.utils.json_to_sheet(files[fileId].rows, {header: this.header});
      wb.Sheets[`${files[fileId].filename} - ${fileId}`.substr(0, 30)] = ws;
    });

    const wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'binary'});
    saveAs(
      new Blob([this.s2ab(wbout)], {type: 'application/octet-stream'}),
        'CAAT-' + this.convertDate(new Date(), '-') + '.xlsx'
    );
  }

  fix(x: string | null | undefined) {
    return (x || '').replace(/(\r\n|\n|\r)/gm, "\r\n").slice(0, this.MAX_CELL_SIZE)
  }

  /** Outputs the given number as a 2-digit string. Brittle **/
  padTwoDigits(s: number): string {
    return s < 10 ? `0${s}` : `${s}`;
  }

  convertDate(d: Date, delimiter: string): string {
    return [
      this.padTwoDigits(d.getMonth() + 1),
      this.padTwoDigits(d.getDate()),
      d.getFullYear()
    ].join(delimiter);
  }

  /** Converts a string to an array buffer */
  s2ab(s: string): ArrayBuffer {
    const buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
    const view = new Uint8Array(buf); //create uint8array as viewer
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xff; //convert to octet
    }
    return buf;
  }
}
</script>
