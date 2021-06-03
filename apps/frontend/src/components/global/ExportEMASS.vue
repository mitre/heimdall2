<template>
  <v-tooltip top>
    <template #activator="{on}">
      <LinkItem
        key="exportEMASS"
        text="eMASS Spreadsheet"
        icon="mdi-file-excel"
        @click="exportEMASS()"
        v-on="on"
      />
    </template>
    <span>eMASS</span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {Filter, FilteredDataModule} from '../../store/data_filters';
import {Prop} from 'vue-property-decorator';
import {ContextualizedControl} from 'inspecjs/dist/context';
import _ from 'lodash';
import {InspecDataModule} from '../../store/data_store';
import XlsxPopulate from 'xlsx-populate';
import axios from 'axios';
import moment from 'moment';
import {EvaluationFile, ProfileFile} from '../../store/report_intake';

interface Row {
  nist: string;
  cciID: string;
  row: number;
}

interface RowsCache {
  rows: Row[]
}

@Component({
  components: {
    LinkItem
  }
})
export default class ExportEMASS extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  MAX_CELL_SIZE = 32000;
  CCIS_START_ROW = 7

  rowCache: RowsCache = {
    rows: []
  }

  createrowCache(sheet: XlsxPopulate.Sheet) {
    let currentRowNumber = 1;
    sheet._rows.forEach((row) => {
      // Grab the 800-53 Control information, columns start at 1 instead of 0.
      if(currentRowNumber >= this.CCIS_START_ROW) {
        const nistID = row._cells[1]._value
        const cciID = row._cells[7]._value
        if(nistID && cciID) {
          this.rowCache.rows.push({nist: nistID, cciID: cciID, row: currentRowNumber})
        }
      }
      currentRowNumber += 1
    })
  }

  updateRow(root: ContextualizedControl, file: EvaluationFile | ProfileFile | undefined, profileName: string, startTime: string, outputSheet: XlsxPopulate.Sheet, row: Row) {
    // Date Tested column
    outputSheet.cell(`M${row.row}`).value(`${startTime}`);
    // Tested By column
    outputSheet.cell(`N${row.row}`).value(`${file?.filename}\r\n\r\n${profileName}`);
    // Test Results column
    const previousValue = outputSheet.cell(`O${row.row}`).value() || '';
    outputSheet.cell(`O${row.row}`).value((previousValue as String).concat(`${this.createControlResultDescription(root)}`));
  }

  getStartTime(control: ContextualizedControl): string {
    if (control.hdf.segments!.length) {
      return moment(control.hdf.segments![0].start_time).format('DD-MM-YYYY')
    }
    return ''
  }

  calculateComplianceStatuses(sheet: XlsxPopulate.Sheet) {
    let currentRowNumber = 1;
    sheet._rows.forEach((row: XlsxPopulate.Row) => {
      if(currentRowNumber >= this.CCIS_START_ROW) {
        const testResult = row._cells[15]._value
        if(testResult) {
          const lines = testResult.split('\r\n\r\n')
          lines.pop()
          if(lines.every((line) => {return (line.startsWith('Compliant') || line.startsWith('Not Applicable'))})) {
            // If we are compliant, update column L on our current line
            sheet.cell(`L${currentRowNumber}`).value('Compliant')
          } else {
            sheet.cell(`L${currentRowNumber}`).value('Non-Compliant')
          }
        }
      }
      currentRowNumber += 1
    })
  }

  exportEMASS() {
    axios.get(`/static/export/emass.xlsx`, {responseType: 'arraybuffer'}).then(({data}) => {
      this.filter.fromFile.forEach((fileId) => {
        // Find our file within InspecDataModule
        const file = InspecDataModule.allFiles.find(
          (f) => f.unique_id === fileId
        );
        if (file) {
          const profileName = _.get(file, 'evaluation.data.profiles[0].title')
          // Read our spreadsheet
          XlsxPopulate.fromDataAsync(data).then((workbook) => {
            // Choose the sheet eMASS reads
            const outputSheet = workbook.sheet('Test Result Import');
            // Build a cache lining up 800-53 Controls + CCIs with their row number in the spreadsheet
            this.createrowCache(outputSheet);
            const controls = FilteredDataModule.controls({...this.filter, fromFile: [fileId]});
            const hitIds = new Set();
            // Convert them into rows
            for (const ctrl of controls) {
              const root = ctrl.root
              if (hitIds.has(root.hdf.wraps.id)) {
                continue;
              } else {
                hitIds.add(root.hdf.wraps.id);
                const startTime = this.getStartTime(root)
                // Do we have any CCI IDs? If so can we match them to the correct row?
                if(root.data.tags.cci && root.data.tags.cci.length !== 0) {
                  this.rowCache.rows.forEach((row) => {
                    if(root.data.tags.cci.indexOf('CCI-' + row.cciID) !== -1) {
                      this.updateRow(root, file, profileName, startTime, outputSheet, row)
                    }
                  })
                } // If we don't have a CCI
                else {
                  // Prevent copying the same control to multiple rows based off of NIST ID
                  const completedNISTIDs: string[] = []
                  // Try to find an exact match for our NIST id
                  this.rowCache.rows.forEach((row) => {
                    if(root.hdf.raw_nist_tags.indexOf(row.nist) !== -1 && !completedNISTIDs.includes(row.nist)) {
                      completedNISTIDs.push(row.nist)
                      this.updateRow(root, file, profileName, startTime, outputSheet, row)
                    }
                  })
                  // If we have had no matches try to drop any sub-categories in parenthsies
                  if (completedNISTIDs.length === 0) {
                    root.hdf.raw_nist_tags.forEach((nistTag) => {
                      // "SC-7 (5)" -> "SC-7"
                      const strippedNistTag = nistTag.replace(/\s?\(.*\)/g, '')
                      this.rowCache.rows.forEach((row) => {
                        if(row.nist.toLowerCase() == strippedNistTag.toLowerCase() && !completedNISTIDs.includes(row.nist)) {
                          completedNISTIDs.push(row.nist)
                          this.updateRow(root, file, profileName, startTime, outputSheet, row)
                        }
                      })
                    })
                  }
                }
              }
            }
            // Calculate our compliance statuses
            this.calculateComplianceStatuses(outputSheet)
            workbook.outputAsync().then((data: string | Uint8Array | ArrayBuffer | Blob | Buffer) => {
              saveAs(data as Blob, 'eMASS-' + file?.filename + '.xlsx');
            })
          })
        }
      })
    })
  }

  convertStatus(status: string) {
    switch (status){
      case 'Passed':
        return 'Compliant'
      case 'Not Applicable':
        return 'Not Applicable'
      case 'Not Reviewed':
        return 'Non-Compliant'
      case 'Failed':
        return 'Non-Compliant'
    }
  }

  // Create Control Result Description
  createControlResultDescription(control: ContextualizedControl): string {
    let testResult = `${this.convertStatus(control.hdf.status)} - "Test ${control.data.id} - ${control.data.title}"\r\n\r\n`;
    return testResult
  }
}
</script>
