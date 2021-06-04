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
import moment from 'moment';
import XLSX from 'xlsx';
import axios from 'axios';
import {EvaluationFile, ProfileFile} from '../../store/report_intake';

type eMASSRow = {
  [key: string]: string | undefined;
};

type OutputRow = string | undefined;

type eMASSData = {
  [key: string]: eMASSRow
}

@Component({
  components: {
    LinkItem
  }
})
export default class ExportEMASS extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  EMASS_ROW_NAMES = [
    'Control Acronym', 'Control Information', 'Control Implementation Status',
    'Security Control Designation', 'Control Implementation Narrative',
    'AP Acronym', 'CCI', 'CCI Definition', 'Implementation Guidance',
    'Assessment Procedures', 'Inherited', 'Compliance Status', 'Date Tested',
    'Tested By', 'Test Results', 'Compliance Status', 'Date Tested', 'Tested By',
    'Test Results']

  eMASSData: eMASSData = {}

  getStartTime(control: ContextualizedControl): string {
    if (control.hdf.segments!.length) {
      return moment(control.hdf.segments![0].start_time).format('DD-MM-YYYY')
    }
    return ''
  }

  calculateComplianceStatuses(testResult: string) {
    const lines = testResult.split('\r\n\r\n')
    lines.pop()
    if(lines.every((line) => {return (line.startsWith('Compliant') || line.startsWith('Not Applicable'))})) {
      return 'Compliant'
    } else {
      return 'Non-Compliant'
    }
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
    return 'Non-Compliant'
  }

  createControlResultDescription(control: ContextualizedControl): string {
    let testResult = `${this.convertStatus(control.hdf.status)} - "Test ${control.data.id} - ${control.data.title}"\r\n\r\n`;
    return testResult
  }

  addRow(file: EvaluationFile | ProfileFile | undefined, profileName: string, root: ContextualizedControl, nist: string, cciId: string) {
    if(this.eMASSData.hasOwnProperty(nist)) {
      const previousTestResultValue = this.eMASSData[nist].controlResult
      this.eMASSData[nist].controlResult = previousTestResultValue?.concat(this.createControlResultDescription(root))
    } else {
      this.eMASSData[nist] = {
        startTime: this.getStartTime(root),
        testedBy: `${file?.filename}\r\n\r\n${profileName}`,
        cci: cciId,
        controlResult: this.createControlResultDescription(root)
      }
    }
  }

  convertEMASSDataToArrayofArrays(): OutputRow[][] {
    const output: OutputRow[][] = []
    // Add 6 empty rows
    _.times(5, () => {output.push([])})
    // Add header rows
    output.push(this.EMASS_ROW_NAMES)
    for (const [key, value] of Object.entries(this.eMASSData)) {
      output.push([key, '', '', '', '', '', value.cci?.replace('CCI-', ''), '', '', '', '', this.calculateComplianceStatuses(value.controlResult!), value.startTime, value.testedBy, value.controlResult])
    }
    return output
  }

  exportEMASS() {
    axios.get(`/static/export/cci2nist.json`).then((response) => {
      const cci2nistMap = response.data
      this.filter.fromFile.forEach((fileId) => {
        const file = InspecDataModule.allFiles.find(
          (f) => f.unique_id === fileId
        );
        if (file) {
          const wb = XLSX.utils.book_new();
          const profileName = _.get(file, 'evaluation.data.profiles[0].title')
          const controls = FilteredDataModule.controls({...this.filter, fromFile: [fileId]});
          const hitIds = new Set();
          // Convert them into rows
          for (const ctrl of controls) {
            const root = ctrl.root
            if (hitIds.has(root.hdf.wraps.id)) {
              continue;
            } else {
              root.data.tags.cci.forEach((cciID: string) => {
                if(cci2nistMap.hasOwnProperty(cciID)) {
                  this.addRow(file, profileName, root, cci2nistMap[cciID], cciID)
                }
              })
            }
          }
          const ws = XLSX.utils.aoa_to_sheet(this.convertEMASSDataToArrayofArrays())
          XLSX.utils.book_append_sheet(wb, ws, "No Header");
          const wbout = XLSX.write(wb, {bookType: 'xlsx', type: 'binary'});
          saveAs(
            new Blob([this.s2ab(wbout)], {type: 'application/octet-stream'}),
              'eMASS-' + file.filename + '.xlsx'
          );
        }
      })
    })
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
