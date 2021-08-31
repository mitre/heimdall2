<template>
  <v-dialog v-model="showingModal" width="580">
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
            <v-text-field v-model="hostName" label="Host Name" />
            <v-text-field v-model="classification" label="Classification" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Cancel </v-btn>
        <v-btn color="primary" text @click="exportCKL"> Export </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import axios from 'axios';
import {ContextualizedControl, ControlStatus, Severity} from 'inspecjs';
import {ExecJSONProfile} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import Mustache from 'mustache';
import {v4} from 'uuid';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {Filter, FilteredDataModule} from '../../store/data_filters';
import {InspecDataModule} from '../../store/data_store';
import {EvaluationFile, ProfileFile} from '../../store/report_intake';
import {SnackbarModule} from '../../store/snackbar';
import {s2ab} from '../../utilities/export_util';

interface Control {
  vid: string;
  severity: string;
  title: string;
  description: string;
  checkText: string;
  fixText: string;
  classification: string;
  profileName: string;
  startTime: string;
  targetKey: number;
  uuidV4: string;
  cciId: string;
  status: string;
  results: string;
}

interface ControlSet {
  hostName: string;
  targetKey: number;
  classification: string;
  description: string;
  fileName: string;
  startTime: string;
  profileTitle: string;
  profileInfo: string;
  uuid: string;
  controls: Control[];
}

interface OutputData {
  controlSets: ControlSet[];
}

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

  hostName = '';
  classification = '';

  /**
   * Invoked when file(s) are loaded.
   */
  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
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

  addFiledata(file: EvaluationFile | ProfileFile) {
    const profileName = _.get(file, 'evaluation.data.profiles[0].name');
    const controls = FilteredDataModule.controls({
      ...this.filter,
      fromFile: [file.uniqueId]
    });
    this.outputData.controlSets.push({
      fileName: file.filename,
      hostName: this.hostName,
      targetKey: 0,
      classification: this.classification,
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
        return 'high';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      case 'none':
        return 'low';
    }
  }

  cklStatus(
    status: ControlStatus
  ): 'Open' | 'Not_Applicable' | 'NotAFinding' | 'Not_Reviewed' {
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

  getDetails(control: ContextualizedControl, profileName: string): Control {
    return {
      vid: control.data.id,
      severity: this.cklSeverity(control.root.hdf.severity),
      title: control.data.title || '',
      description: control.data.desc || '',
      checkText: control.hdf.descriptions.check || control.data.tags.check,
      fixText: control.hdf.descriptions.fix || control.data.tags.fix,
      classification: this.classification,
      profileName: profileName,
      startTime: new Date(
        _.get(control, 'hdf.segments![0].start_time') || undefined
      ).toString(),
      targetKey: 0,
      uuidV4: v4(),
      cciId: control.data.tags.cci,
      status: this.cklStatus(control.hdf.status),
      results: ''
    };
  }

  exportCKL(): void {
    if (this.filter.fromFile.length === 0) {
      return SnackbarModule.failure('No files have been loaded.');
    }
    // template
    axios.get(`/static/export/cklExport.ckl`).then(({data}) => {
      this.filter.fromFile.forEach(async (fileId) => {
        const file = InspecDataModule.allFiles.find(
          (f) => f.uniqueId === fileId
        );
        if (file) {
          this.addFiledata(file);
        }
      });
      this.outputData.controlSets.forEach((controlSet) => {
        const body = Mustache.render(data, controlSet).replace(
          /[^\x00-\x7F]/g,
          ''
        );
        saveAs(
          new Blob([s2ab(body)], {type: 'application/octet-stream'}),
          `${controlSet.fileName}.ckl`.replace(/[ :]/g, '_')
        );
      });
    });

    this.closeModal();
  }
}
</script>
