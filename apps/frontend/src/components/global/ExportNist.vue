<template>
  <v-tooltip top>
    <template v-slot:activator="{on}">
      <LinkItem
        key="export_nist"
        text="NIST SP 800-53 Security Control Coverage"
        icon="mdi-file-excel-outline"
        @click="export_nist()"
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

import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {NistControl} from 'inspecjs/dist/nist';
import {FileID} from '@/store/report_intake';
import {InspecDataModule} from '@/store/data_store';

const MAX_CELL_SIZE = 32000; // Rounding a bit here.
const MAX_SHEET_NAME_SIZE = 31;
export type NISTRow = [string];
export type NISTList = NISTRow[];

export interface Sheet {
  name: string;
  data: NISTList;
}

// We declare the props separately
// to make props types inferrable.
const Props = Vue.extend({
  props: {
    filter: {
      type: Object, // Of type Filter
      required: true
    }
  }
});

@Component({
  components: {
    LinkItem
  }
})
export default class ExportNIST extends Props {
  /** Formats a tag into a well-structured nist string */
  format_tag(control: NistControl): string | null {
    // For now just do raw text. Once Mo's nist work is done we can make sure these are well formed
    if (control.raw_text) {
      return control.raw_text.replace(/\s/g, '');
    } else if (control.sub_specifiers.length < 2) {
      // Too short: abort
      return null;
    } else {
      // Just construct as best we can
      let base = control.sub_specifiers[0] + '-' + control.sub_specifiers[1];
      for (let i = 2; i < control.sub_specifiers.length; i++) {
        base += control.sub_specifiers[i];
      }
      return base;
    }
  }

  /** Makes a sheet for the given file id */
  sheet_for(file?: FileID): Sheet {
    // If file not provided
    let filename: string = 'All files';
    let id: FileID[] = FilteredDataModule.selected_file_ids;
    if (file) {
      id = [file];
      filename = InspecDataModule.allFiles.find(x => x.unique_id == file)!
        .filename;
    }

    // Get our data
    let base_filter = this.filter as Filter;
    let modified_filter: Filter = {...base_filter, fromFile: id};
    let controls = FilteredDataModule.controls(modified_filter);

    // Initialize our data structures
    let sheet: NISTList = [
      [`${filename} NIST SP 800-53 Security Control Coverage`]
    ];

    // Get them all
    let nist_controls: NistControl[] = [];
    controls.forEach(c => {
      let tags = c.root.hdf.parsed_nist_tags;
      tags.forEach(t => {
        if (
          !nist_controls.some(
            other_tag => this.format_tag(other_tag) === this.format_tag(t)
          )
        ) {
          nist_controls.push(t);
        }
      });
    });

    // Sort them
    nist_controls = nist_controls.sort((a, b) => a.localCompare(b));

    // Turn to strings
    let as_strings_mostly = nist_controls.map(c => this.format_tag(c));

    // Filter out nulls, bind into rows
    let as_rows = as_strings_mostly
      .filter(v => v !== null)
      .map(v => [v]) as NISTList;

    // Append to caat
    sheet.push(...as_rows);

    return {
      name: filename.slice(0, MAX_SHEET_NAME_SIZE),
      data: sheet
    };
  }

  export_nist() {
    // Get files we plan on exporting
    let files: Array<FileID | undefined> = [
      undefined,
      ...FilteredDataModule.selected_file_ids
    ];

    // Convert to sheets
    let sheets = files.map(file => this.sheet_for(file));

    // Handle XLSX exporting
    let wb = XLSX.utils.book_new();

    wb.Props = {
      Title: 'NIST SP 800-53 Security Control Coverage',
      Subject: 'Controls',
      Author: 'Heimdall',
      CreatedDate: new Date()
    };

    // Push all sheets
    sheets.forEach(sheet => {
      // Avoid name duplication
      let i = 2;
      let new_name = sheet.name;
      while (wb.SheetNames.includes(new_name)) {
        let appendage = ` (${i})`;
        new_name = sheet.name.slice(0, MAX_SHEET_NAME_SIZE - appendage.length);
        new_name += appendage;
      }
      wb.SheetNames.push(new_name);

      let ws = XLSX.utils.aoa_to_sheet(sheet.data);
      wb.Sheets[new_name] = ws;
    });

    let wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'binary'});
    saveAs(
      new Blob([this.s2ab(wbout)], {type: 'application/octet-stream'}),
      'NIST-SP-800-53-Security-Control-Coverage-' +
        this.convertDate(new Date(), '-') +
        '.xlsx'
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
