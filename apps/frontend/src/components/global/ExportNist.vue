<template>
  <v-tooltip top>
    <template #activator="{on}">
      <IconLinkItem
        key="export_nist"
        text="NIST SP 800-53 Security and Privacy Control Coverage"
        icon="mdi-file-excel"
        @click="export_nist()"
        v-on="on"
      />
    </template>
    <span>Compliance Assessment Audit Tracking Data</span>
  </v-tooltip>
</template>

<script lang="ts">
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {FileID} from '@/store/report_intake';
import {s2ab} from '@/utilities/export_util';
import {saveAs} from 'file-saver';
import {NistControl} from 'inspecjs';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import * as XLSX from '@e965/xlsx';

const MAX_SHEET_NAME_SIZE = 31;
export type NISTRow = [string];
export type NISTList = NISTRow[];

export interface Sheet {
  name: string;
  data: NISTList;
}

@Component({
  components: {
    IconLinkItem
  }
})
export default class ExportNIST extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  /** Formats a tag into a well-structured nist string */
  format_tag(control: NistControl): string | null {
    // For now just do raw text. Once Mo's nist work is done we can make sure these are well formed
    if (control.rawText) {
      return control.rawText.replace(/\s/g, '');
    } else if (control.subSpecifiers.length < 2) {
      // Too short: abort
      return null;
    } else {
      // Just construct as best we can
      let base = `${control.subSpecifiers[0]}-${control.subSpecifiers[1]}`;
      for (let i = 2; i < control.subSpecifiers.length; i++) {
        base += control.subSpecifiers[i];
      }
      return base;
    }
  }

  /** Makes a sheet for the given file id */
  sheet_for(file?: FileID): Sheet {
    // If file not provided
    let filename = 'All files';
    let id: FileID[] = FilteredDataModule.selected_file_ids;
    if (file) {
      id = [file];
      filename =
        InspecDataModule.allFiles.find((x) => x.uniqueId === file)?.filename ||
        'Unknown Filename';
    }

    // Get our data
    const baseFilter = this.filter;
    const modifiedFilter: Filter = {...baseFilter, fromFile: id};
    const controls = FilteredDataModule.controls(modifiedFilter);

    // Initialize our data structures
    const sheet: NISTList = [
      [`${filename} NIST SP 800-53 Security and Privacy Control Coverage`]
    ];

    // Get them all
    let nistControls: NistControl[] = [];
    controls.forEach((c) => {
      const tags = c.root.hdf.parsedNistTags;
      tags.forEach((t) => {
        if (
          !nistControls.some(
            (otherTag) => this.format_tag(otherTag) === this.format_tag(t)
          )
        ) {
          nistControls.push(t);
        }
      });
    });

    // Sort them
    nistControls = nistControls.sort((a, b) => a.localCompare(b));

    // Turn to strings
    const asStringsMostly = nistControls.map((c) => this.format_tag(c));

    // Filter out nulls, bind into rows
    const asRows = asStringsMostly
      .filter((v) => v !== null)
      .map((v) => [v]) as NISTList;

    // Append to caat
    sheet.push(...asRows);

    return {
      name: filename.slice(0, MAX_SHEET_NAME_SIZE),
      data: sheet
    };
  }

  export_nist() {
    // Get files we plan on exporting
    const files: Array<FileID | undefined> = [
      undefined,
      ...FilteredDataModule.selected_file_ids
    ];

    // Convert to sheets
    const sheets = files.map((file) => this.sheet_for(file));

    // Handle XLSX exporting
    const wb = XLSX.utils.book_new();

    wb.Props = {
      Title: 'NIST SP 800-53 Security and Privacy Control Coverage',
      Subject: 'Controls',
      Author: 'Heimdall',
      CreatedDate: new Date()
    };

    // Push all sheets
    sheets.forEach((sheet) => {
      // Avoid name duplication
      let i = 2;
      let newName = sheet.name;
      while (wb.SheetNames.includes(newName)) {
        const appendage = ` (${i})`;
        newName = sheet.name.slice(0, MAX_SHEET_NAME_SIZE - appendage.length);
        newName += appendage;
        i++;
      }
      wb.SheetNames.push(newName);

      const ws = XLSX.utils.aoa_to_sheet(sheet.data);
      wb.Sheets[newName] = ws;
    });

    const wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'binary'});
    saveAs(
      new Blob([s2ab(wbout)], {type: 'application/octet-stream'}),
      `NIST-SP-800-53-Security-and-Privacy-Control-Coverage-${this.convertDate(
        new Date(),
        '-'
      )}.xlsx`
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
}
</script>
