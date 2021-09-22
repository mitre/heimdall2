<template>
  <v-dialog v-model="showingModal">
    <template #activator="{on}">
      <LinkItem
        key="export_ckl"
        text="Export as Checklist"
        icon="mdi-check-all"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Export as Checklist </v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <v-data-table
              v-model="selected"
              dense
              :headers="headers"
              :items="evaluations"
              :single-select="false"
              item-key="uniqueId"
              show-select
            >
              <template #[`item.hostname`]="{item}">
                <v-text-field v-model="item.hostname" dense />
              </template>
              <template #[`item.ip`]="{item}">
                <v-text-field v-model="item.ip" dense />
              </template>
              <template #[`item.mac`]="{item}">
                <v-text-field v-model="item.mac" dense />
              </template>
              <template #[`item.fqdn`]="{item}">
                <v-text-field v-model="item.fqdn" dense /> </template
            ></v-data-table>
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Cancel </v-btn>
        <v-btn
          color="primary"
          text
          :disabled="!selected.length"
          @click="exportCKL"
        >
          Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {Filter, FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {
  cleanUpFilename,
  saveSingleOrMultipleFiles
} from '@/utilities/export_util';
import axios from 'axios';
import {
  ContextualizedControl,
  ControlStatus,
  HDFControlSegment,
  Severity
} from 'inspecjs';
import {ExecJSONProfile} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import Mustache from 'mustache';
import {v4} from 'uuid';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

interface Control {
  vid: string;
  severity: string;
  title: string;
  description: string;
  checkText: string;
  fixText: string;
  profileName: string;
  startTime: string;
  targetKey: number;
  uuidV4: string;
  cciId: string;
  status: string;
  results: string;
}

interface ControlSet {
  hostname: string;
  ip: string;
  mac: string;
  fqdn: string;
  targetKey: number;
  description: string;
  fileName: string;
  startTime: string;
  profileTitle: string;
  profileInfo: string;
  uuid: string;
  controls: Control[];
}

type ExtendedEvaluationFile = (EvaluationFile | ProfileFile) & {
  hostname: string;
  ip: string;
  mac: string;
  fqdn: string;
};

interface OutputData {
  controlSets: ControlSet[];
}

type FileData = {
  filename: string;
  data: string;
};

@Component({
  components: {
    LinkItem
  }
})
export default class ExportCKLModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  showingModal = false;
  outputData: OutputData = {
    controlSets: []
  };

  selected: ExtendedEvaluationFile[] = [];
  headers = [
    {text: 'File Name', value: 'filename'},
    {text: 'Host Name', value: 'hostname'},
    {text: 'Host IP', value: 'ip'},
    {text: 'Host MAC', value: 'mac'},
    {text: 'Host FQDN', value: 'fqdn'}
  ];

  /**
   * Invoked when file(s) are loaded.
   */
  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
  }

  // Get our evaluation info for our export table
  get evaluations(): ExtendedEvaluationFile[] {
    const files: ExtendedEvaluationFile[] = [];
    this.filter.fromFile.forEach(async (fileId) => {
      const file = InspecDataModule.allFiles.find((f) => f.uniqueId === fileId);
      if (file) {
        files.push({
          ...file,
          hostname: _.get(file, 'evaluation.data.passthrough.hostname') || '',
          fqdn: _.get(file, 'evaluation.data.passthrough.fqdn') || '',
          mac: _.get(file, 'evaluation.data.passthrough.mac') || '',
          ip: _.get(file, 'evaluation.data.passthrough.ip') || ''
        });
      }
    });
    return files;
  }

  getProfileInfo(file: EvaluationFile | ProfileFile) {
    let result = '';
    const profile: ExecJSONProfile = _.get(file, 'evaluation.data.profiles[0]');
    if (file.filename) {
      result += `File Name: ${file.filename}\n`;
    }
    if (profile.version) {
      result += `Version: ${profile.version}\n`;
    }
    if (profile.sha256) {
      result += `SHA256 Hash: ${profile.sha256}\n`;
    }
    if (profile.maintainer) {
      result += `Maintainer: ${profile.maintainer}\n`;
    }
    if (profile.copyright) {
      result += `Copyright: ${profile.copyright}\n`;
    }
    if (profile.copyright_email) {
      result += `Copyright Email: ${profile.copyright_email}\n`;
    }
    if (profile.controls.length) {
      result += `Control Count: ${profile.controls.length}\n`;
    }
    return result.trim();
  }

  addFiledata(file: ExtendedEvaluationFile) {
    const profileName = _.get(file, 'evaluation.data.profiles[0].name');
    const controls = FilteredDataModule.controls({
      ...this.filter,
      fromFile: [file.uniqueId]
    });
    this.outputData.controlSets.push({
      fileName: file.filename,
      hostname: file.hostname,
      ip: file.ip,
      mac: file.mac,
      fqdn: file.fqdn,
      targetKey: 0,
      description: 'desc',
      startTime: new Date().toString(),
      profileTitle: profileName,
      profileInfo: this.getProfileInfo(file),
      uuid: v4(),
      controls: controls.map((control) => this.getDetails(control, profileName))
    });
  }

  cklSeverity(severity: Severity): 'low' | 'medium' | 'high' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
      case 'none':
        return 'low';
      default:
        return 'high';
    }
  }

  cklStatus(status: ControlStatus): string {
    switch (status) {
      case 'Not Applicable':
      case 'From Profile':
        return 'Not_Applicable';
      case 'Profile Error':
      case 'Not Reviewed':
        return 'Not_Reviewed';
      case 'Passed':
        return 'NotAFinding';
      default:
        return 'Open';
    }
  }

  cklResults(segments?: HDFControlSegment[]): string {
    if (typeof segments === 'undefined') {
      return '';
    } else {
      return segments
        .map((segment) => {
          if (segment.message) {
            return `${segment.status}\n${segment.code_desc}\n${segment.message}`;
          } else {
            return `${segment.status}\n${segment.code_desc}`;
          }
        })
        .join('\n--------------------------------\n');
    }
  }

  getDetails(control: ContextualizedControl, profileName: string): Control {
    return {
      vid: control.data.id,
      severity: this.cklSeverity(control.root.hdf.severity),
      title: control.data.title || '',
      description: control.data.desc || '',
      checkText: control.hdf.descriptions.check || control.data.tags.check,
      fixText: control.hdf.descriptions.fix || control.data.tags.fix,
      profileName: profileName,
      startTime: _.get(control, 'hdf.segments![0].start_time'),
      targetKey: 0,
      uuidV4: v4(),
      cciId: control.data.tags.cci,
      status: this.cklStatus(control.hdf.status),
      results: this.cklResults(control.hdf.segments)
    };
  }

  exportCKL(): void {
    if (this.filter.fromFile.length === 0) {
      return SnackbarModule.failure('No files have been loaded.');
    }
    axios.get(`/static/export/cklExport.ckl`).then(({data}) => {
      this.selected.forEach(async (file) => {
        this.addFiledata(file);
      });
      const files: FileData[] = this.outputData.controlSets.map(
        (controlSet) => {
          return {
            filename: `${cleanUpFilename(controlSet.fileName)}.ckl`,
            data: Mustache.render(data, controlSet).replace(/[^\x00-\x7F]/g, '')
          };
        }
      );
      saveSingleOrMultipleFiles(files, 'ckl');
      this.outputData.controlSets = [];
    });

    this.closeModal();
  }
}
</script>
