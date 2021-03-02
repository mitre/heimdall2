<template>
  <v-tooltip top>
    <template #activator="{on}">
      <LinkItem
        key="export_caat"
        text="CAAT Spreadsheet"
        icon="mdi-file-excel"
        @click="export_caat()"
        v-on="on"
      />
    </template>
    <span>Compliance Assessment Audit Tracking Data</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {FilteredDataModule, Filter} from '@/store/data_filters';
import XLSX from 'xlsx';
import {saveAs} from 'file-saver';
import {HDFControl} from 'inspecjs';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {Prop} from 'vue-property-decorator';
import _ from 'lodash';

const MAX_CELL_SIZE = 32000; // Rounding a bit here.
type CAATRow = string[];

@Component({
  components: {
    LinkItem
  }
})
export default class ExportCaat extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  /** Turns a control into a CAAT row.
   *  Checks vuln_list first to see if this gid is already included
   */
  to_rows(control: HDFControl): CAATRow[] {
    // init rows
    let all_rows: CAATRow[] = [];

    for (let formatted of control.canonized_nist({
      max_specifiers: 3,
      pad_zeros: true,
      allow_letters: false,
      add_spaces: false
    })) {
      // Establish our row
      let row: CAATRow = [];

      if (!formatted) {
        continue;
      }

      // Designate a helper to deal with null/undefined
      let fix = (x: string | null | undefined) =>
        (x || '').replace(/(\r\n|\n|\r)/gm, "\r\n").slice(0, MAX_CELL_SIZE);

      // Build up the row
      row.push(formatted); // Control Number
      row.push(
        'Test ' + fix(control.wraps.id) + ' - ' + fix(control.wraps.title)
      ); // Finding Title
      if (control.start_time) {
        row.push(this.convertDate(new Date(control.start_time), '/')); // Date Identified
      } else {
        row.push('');
      }
      row.push(''); //row.push(fix(control.wraps.tags.stig_id)); // Finding ID
      row.push(''); // Information System or Program Name
      row.push(''); // Repeat Findings
      row.push(''); // Repeat Finding CFACTS Weakness ID
      row.push(fix(control.wraps.title)); // Finding Description
      // Prepend the caveat to the Weakness Description if there is one
      let caveat = control.descriptions.caveat ? '(Caveat: ' + fix(control.descriptions.caveat) + ')\n' : '';
      row.push(caveat + fix(control.wraps.desc)); // Weakness Description
      row.push('Security'); // Control Weakness Type
      row.push('Self-Assessment '); // Source
      row.push(''); //row.push("InSpec"); // Assessment/Audit Company
      row.push('Test'); // Test Method
      row.push(fix(control.descriptions.check || control.wraps.tags.check)); // Test Objective
      let test_result = `${control.status}: ${control.message}`;
      if(_.get(control, 'wraps.attestation.explanation')){
        test_result += ` -- ${_.get(control, 'wraps.attestation.explanation')}`
      }
      row.push(fix(test_result)); // Test Result Description
      if (control.status === 'Passed') {
        row.push('Satisfied');
      }
      else if (_.get(control, 'wraps.results[0].status') === 'skipped'){
        row.push(`Skipped: ${_.get(control, 'wraps.results[0].skip_message')}`);
      } else {
        row.push('Other Than Satisfied');
      }
      row.push(fix(control.descriptions.fix || control.wraps.tags.fix)); // Recommended Corrective Action(s)
      row.push(''); // Effect on Business
      row.push(''); // Likelihood
      const controlSeverity = control.severity === 'medium' ? 'moderate' : control.severity
      row.push(fix(control.wraps.impact === 0 ? 'none' : controlSeverity)); // Impact

      if (row.length !== this.header().length) {
        throw new Error('Row of wrong size');
      }
      all_rows.push(row);
    }
    return all_rows;
  }

  /** Gets the standardized CAAT header */
  header(): CAATRow {
    return [
      'Control Number',
      'Finding Title',
      'Date Identified',
      'Finding ID',
      'Information System or Program Name',
      'Repeat Findings',
      'Repeat Finding Weakness ID',
      'Finding Description',
      'Weakness Description',
      'Control Weakness Type',
      'Source',
      'Assessment/Audit Company',
      'Test Method',
      'Test Objective',
      'Test Result Description',
      'Test Result',
      'Recommended Corrective Action(s)',
      'Effect on Business',
      'Likelihood',
      'Impact'
    ];
  }

  export_caat() {
    // Get our data
    let controls = FilteredDataModule.controls(this.filter);

    // Initialize our data structures
    let caat: CAATRow[] = [this.header()];

    // Turn controls into rows
    let non_deduped_rows: Array<CAATRow> = [];
    let hit_ids = new Set();
    for (let ctrl of controls) {
      let root = ctrl.root.hdf;
      if (hit_ids.has(root.wraps.id)) {
        continue;
      } else {
        hit_ids.add(root.wraps.id);
        non_deduped_rows.push(...this.to_rows(root));
      }
    }

    // Deduplicate controls
    let hit_controls = new Set();
    let rows = [];
    for (let r of non_deduped_rows) {
      let ctrl = r[0];
      if (!hit_controls.has(ctrl)) {
        hit_controls.add(ctrl);
        rows.push(r);
      }
    }
    // DEBUG
    rows = non_deduped_rows;

    // Sort them by id
    rows = rows.sort((a, b) => {
      // We sort by control (index 0), then by severity within
      let a_fam = a[0];
      let a_imp = a[19];
      let b_fam = b[0];
      let b_imp = b[19];
      if (a_fam !== b_fam) {
        return a_fam.localeCompare(b_fam);
      } else {
        return a_imp.localeCompare(b_imp);
      }
    });

    // Append to caat
    caat.push(...rows);

    // Handle XLSX exporting
    let wb = XLSX.utils.book_new();

    wb.Props = {
      Title: 'Compliance Assessment/Audit Tracking (CAAT) Spreadsheet',
      Subject: 'Assessment Data',
      Author: 'Heimdall',
      CreatedDate: new Date()
    };

    wb.SheetNames.push('Assessment Data');

    let ws = XLSX.utils.aoa_to_sheet(caat);
    wb.Sheets['Assessment Data'] = ws;

    let wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'binary'});
    saveAs(
      new Blob([this.s2ab(wbout)], {type: 'application/octet-stream'}),
      'CAAT-' + this.convertDate(new Date(), '-') + '.xlsx'
    );
  }

  /** Outputs the given number as a 2-digit string. Brittle **/
  pad_two_digits(s: number): string {
    return s < 10 ? `0${s}` : `${s}`;
  }

  convertDate(d: Date, delimiter: string): string {
    return [
      this.pad_two_digits(d.getMonth() + 1),
      this.pad_two_digits(d.getDate()),
      d.getFullYear()
    ].join(delimiter);
  }

  /** Converts a string to an array buffer */
  s2ab(s: string): ArrayBuffer {
    let buf = new ArrayBuffer(s.length); //convert s to arrayBuffer
    let view = new Uint8Array(buf); //create uint8array as viewer
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xff; //convert to octet
    }
    return buf;
  }
}
</script>
