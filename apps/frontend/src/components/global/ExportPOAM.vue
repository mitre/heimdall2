<template>
  <v-tooltip top>
    <template #activator="{on}">
      <LinkItem
        key="exportPOAM"
        text="POAM Spreadsheet"
        icon="mdi-file-excel"
        @click="exportPOAM()"
        v-on="on"
      />
    </template>
    <span>POA&amp;M</span>
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
import {SegmentStatus} from 'inspecjs';

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
export default class ExportPOAM extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  MAX_CELL_SIZE = 32000;
  CCIS_START_ROW = 7

  rowCache: RowsCache = {
    rows: []
  }

  updateRow(root: ContextualizedControl, file: EvaluationFile | ProfileFile | undefined, profileName: string, startTime: string, outputSheet: XlsxPopulate.Sheet, row: Row) {
    // Date Tested column
    outputSheet.cell(`M${row.row}`).value(`${startTime}`);
    // Tested By column
    outputSheet.cell(`N${row.row}`).value(`${file?.filename}\r\n\r\n${profileName}`);
    // Test Results column
    const previousValue = outputSheet.cell(`O${row.row}`).value() || '';
    outputSheet.cell(`O${row.row}`).value((previousValue as string).concat(`${this.createControlResultDescription(root)}`));
  }

  getStartTime(control: ContextualizedControl): string {
    if (control.hdf.segments?.length) {
      return moment(control.hdf.segments[0].start_time).format('M/DD/YYYY')
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
          if(lines.every((line) => (line.startsWith('Compliant') || line.startsWith('Not Applicable')))) {
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

  convertToRawSeverity(severity: string) {
    switch (severity) {
      case 'none':
        return 'Unknown';
      case 'low':
        return 'I';
      case 'medium':
        return 'II'
      case 'high':
        return 'III';
      case 'critical':
        return 'IIII'
    }
  }

  exportPOAM() {
    axios.get(`/static/export/POAM.xlsx`, {responseType: 'arraybuffer'}).then(({data}) => {
      this.filter.fromFile.forEach((fileId) => {
        // Find our file within InspecDataModule
        const file = InspecDataModule.allFiles.find(
          (f) => f.unique_id === fileId
        );
        if (file) {
          const profileName = _.get(file, 'evaluation.data.profiles[0].title')
          const profileHash = _.get(file, 'evaluation.data.profiles[0].sha256')
          const profileMaintainer = _.get(file, 'evaluation.data.profiles[0].maintainer')
          const profileCopyrightEmail = _.get(file, 'evaluation.data.profiles[0].copyright_email')
          // Read our spreadsheet
          XlsxPopulate.fromDataAsync(data).then((workbook) => {
            // Choose the sheet eMASS reads
            const outputSheet = workbook.sheet('POA&M');
            const controls = FilteredDataModule.controls({...this.filter, fromFile: [fileId]});
            let row = 8;
            // Convert them into rows
            for (const ctrl of controls) {
              const startTime = this.getStartTime(ctrl)
              const ccis = ctrl.hdf.raw_nist_tags.filter((tag) => !tag.toLowerCase().startsWith('rev')).map((tag) => tag.replace(/\s?\(.*\)/g, ''))

              outputSheet.cell(`B${row}`).value(row-7)
              outputSheet.cell(`C${row}`).value(`Title:\r\n${ctrl.data.title||''}\r\n\r\nDescription:\r\n${ctrl.data.desc||''}`)
              outputSheet.cell(`D${row}`).value(ccis.join('\r\n'))
              if(profileMaintainer){
                if(profileCopyrightEmail) {
                  outputSheet.cell(`E${row}`).value(`${profileMaintainer}, ${profileCopyrightEmail}`)
                } else {
                  outputSheet.cell(`E${row}`).value(`${profileMaintainer}`)
                }
              } else {
                if(profileCopyrightEmail) {
                  outputSheet.cell(`E${row}`).value(profileCopyrightEmail)
                }
              }

              outputSheet.cell(`F${row}`).value(ctrl.data.id)
              outputSheet.cell(`H${row}`).value(startTime)
              outputSheet.cell(`K${row}`).value(profileName)
              outputSheet.cell(`L${row}`).value('Not Applicable')
              outputSheet.cell(`N${row}`).value(this.convertToRawSeverity(ctrl.hdf.severity))
              outputSheet.cell(`O${row}`).value(
                `Automated compliance tests brought to you by the MITRE corporation and the InSpec project.\r\n\r\nInspec Profile: ${profileName}\r\nProfile shasum: ${profileHash}\r\n\r\n` +
                `${this.createSummary(ctrl)}\r\n\r\n${this.createControlResultDescription(ctrl)}`
              )
              row += 1;
            }
            // Calculate our compliance statuses
            workbook.outputAsync().then((workborkData) => {
              saveAs(workborkData as Blob, `POAM-${file?.filename}.xlsx`);
            })
          })
        }
      })
    })
  }

  createSummary(control: ContextualizedControl): string {
    if(control.hdf.segments?.every((segment) => segment.status === 'passed')) {
      return 'All automated tests passed for the control'
    } else if (control.hdf.status === 'Passed' && !control.hdf.segments?.every((segment) => segment.status === 'passed')) {
      return 'Some tests were skipped and led to a passing result for the control'
    } else if (control.hdf.segments?.every((segment) => segment.status === 'skipped')) {
      return 'All automated controls were skipped for the control'
    } else if (control.hdf.segments?.every((segment) => segment.status === 'failed')) {
      return 'All automated tests failed for the control'
    } else if (control.hdf.status === 'Failed' && !control.hdf.segments?.every((segment) => segment.status === 'failed')) {
      return 'Some automated tests failed for the control'
    } else {
      return ''
    }
  }

  convertStatus(status: SegmentStatus) {
    switch (status){
      case 'passed':
        return 'PASS'
      case 'failed':
        return 'FAILED'
      case 'skipped':
        return 'SKIPPED'
      case 'error':
        return 'ERROR'
      default:
        return 'NOT_APPLICABLE'
    }
  }

  // Create Control Result Description
  createControlResultDescription(control: ContextualizedControl): string {
    return control.hdf.segments?.map((segment) => `${this.convertStatus(segment.status)} -- Test: ${segment.code_desc}`).join('\r\n') || ''
  }
}
</script>
