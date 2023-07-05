<template>
  <v-dialog v-model="showingModal" width="580">
    <template #activator="{on}">
      <LinkItem
        key="export_html"
        text="Export as HTML"
        icon="mdi-language-html5"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Export as HTML </v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <v-radio-group v-model="exportType">
              <v-radio label="Executive Report" value="executive" />
              <v-radio label="Manager Report" value="manager" />
              <v-radio label="Administrator Report" value="administrator" />
            </v-radio-group>
          </v-col>
          <v-col>
            <pre class="pt-5" v-text="description" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Cancel </v-btn>
        <v-btn color="primary" :disabled="!exportType" text @click="exportHTML">
          Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {s2ab} from '@/utilities/export_util';
import {
  mdiAlertCircle,
  mdiCheckCircle,
  mdiCloseCircle,
  mdiMinusCircle,
  mdiAlert,
  mdiCircle,
  mdiEqualBox
} from '@mdi/js';
import axios from 'axios';
import {saveAs} from 'file-saver';
import {ContextualizedControl, HDFControlSegment} from 'inspecjs';
import _ from 'lodash';
import Mustache from 'mustache';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
import {Filter, FilteredDataModule} from '../../store/data_filters';
import {InspecDataModule} from '../../store/data_store';
import {EvaluationFile, ProfileFile} from '../../store/report_intake';
import {SnackbarModule} from '../../store/snackbar';
import {StatusCountModule} from '../../store/status_counts';
import {SeverityCountModule} from '@/store/severity_counts';

interface FileInfo {
  filename: string;
  toolVersion: string;
  platform: string;
  duration: string;
}

interface Statistics {
  passed: number;
  failed: number;
  notApplicable: number;
  notReviewed: number;
  profileError: number;
  totalControls: number;
  passedTests: number;
  passingTestsFailedControl: number;
  failedTests: number;
  totalTests: number;
}

interface Severity {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface Compliance {
  level: string;
  color: string;
}

interface Detail {
  name: string;
  value: string;
  class?: string;
}

interface ControlStatus {
  status: string;
  color: string;
}

interface ControlSet {
  filename: string;
  fileID: string;
  controls: (ContextualizedControl & {details: Detail[]} & {
    controlStatus: ControlStatus;
  })[];
}

interface Icons {
  [key: string]: string;
}

interface OutputData {
  files: FileInfo[];
  statistics: Statistics;
  severity: Severity;
  compliance: Compliance;
  controlSets: ControlSet[];
  showControlSets: boolean;
  showCode: boolean;
  exportType: string;
  icons: Icons;
}

@Component({
  components: {
    LinkItem
  }
})
export default class ExportHTMLModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  // If we are exporting a profile we can remove the test/results table
  @Prop({type: String, required: true}) readonly fileType!: string;

  showingModal = false;
  exportType = 'executive';
  description = 'Profile Info\nStatuses\nCompliance Level';
  outputData: OutputData = {
    statistics: {
      passed: 0,
      failed: 0,
      notApplicable: 0,
      notReviewed: 0,
      profileError: 0,
      totalControls: 0,
      passedTests: 0,
      passingTestsFailedControl: 0,
      failedTests: 0,
      totalTests: 0
    },
    severity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    compliance: {
      level: '',
      color: ''
    },
    files: [],
    controlSets: [],
    showControlSets: false,
    showCode: false,
    exportType: '',
    icons: {
      circleCheck: this.iconDatatoSVG(mdiCheckCircle, 'rgb(76, 176, 79)'), // green
      circleCross: this.iconDatatoSVG(mdiCloseCircle, 'rgb(243, 67, 53)'), // red
      circleMinus: this.iconDatatoSVG(mdiMinusCircle, 'rgb(3, 169, 244)'), // blue
      circleAlert: this.iconDatatoSVG(mdiAlertCircle, 'rgb(254, 153, 0)'), // yellow
      triangleAlert: this.iconDatatoSVG(mdiAlert, 'rgb(121, 134, 203)'), // purple
      squareEqual: this.iconDatatoSVG(mdiEqualBox, 'black'),
      circleLow: this.iconDatatoSVG(mdiCircle, 'rgb(255, 235, 59)'), // yellow
      circleMedium: this.iconDatatoSVG(mdiCircle, 'rgb(255, 152, 0)'), // orange
      circleHigh: this.iconDatatoSVG(mdiCircle, 'rgb(255, 87, 34)'), // deep orange
      circleCritical: this.iconDatatoSVG(mdiCircle, 'rgb(244, 67, 54)') // red
    }
  };

  @Watch('exportType')
  onFileChanged(newValue: string, _oldValue: string) {
    switch (newValue) {
      case 'executive':
        this.description = 'Profile Info\nStatuses\nCompliance Level';
        this.outputData.showControlSets = false;
        this.outputData.showCode = false;
        break;
      case 'manager':
        this.description =
          'Profile Info\nStatuses\nCompliance Level\nTest Results and Details';
        this.outputData.showControlSets = true;
        this.outputData.showCode = false;
        break;
      case 'administrator':
        this.description =
          'Profile Info\nStatuses\nCompliance Level\nTest Results and Details\nTest Code';
        this.outputData.showControlSets = true;
        this.outputData.showCode = true;
        break;
    }
  }

  iconDatatoSVG(
    iconData: string,
    fill: string,
    widthPx = 24,
    heightPx = 24
  ): string {
    return `<svg style="width:${widthPx}px; height:${heightPx}px" viewBox="0 0 ${widthPx} ${heightPx}"><path fill="${fill}" d="${iconData}"/></svg>`;
  }

  /**
   * Invoked when file(s) are loaded.
   */
  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
  }

  addFiledata(file: EvaluationFile | ProfileFile) {
    this.outputData.files.push({
      filename: file.filename,
      toolVersion: _.get(file, 'evaluation.data.version') as unknown as string,
      platform: _.get(
        file,
        'evaluation.data.platform.name'
      ) as unknown as string,
      duration: _.get(
        file,
        'evaluation.data.statistics.duration'
      ) as unknown as string
    });
    this.outputData.exportType = _.capitalize(this.exportType);
    const allControlLevels = FilteredDataModule.controls({
      ...this.filter,
      fromFile: [file.uniqueId],
      omit_overlayed_controls: false
    });
    const controls = FilteredDataModule.controls({
      ...this.filter,
      fromFile: [file.uniqueId],
      omit_overlayed_controls: true
    });
    // Convert them into rows
    this.outputData.controlSets.push({
      filename: file.filename,
      fileID: file.uniqueId,
      controls: controls.map((control) =>
        this.addDetails(
          control,
          allControlLevels.filter(
            (searchingControl) => searchingControl.data.id === control.data.id
          )
        )
      )
    });
  }

  resetOutputData() {
    const controlCnt =
      StatusCountModule.countOf(this.filter, 'Passed') +
      StatusCountModule.countOf(this.filter, 'Failed') +
      StatusCountModule.countOf(this.filter, 'Not Applicable') +
      StatusCountModule.countOf(this.filter, 'Not Reviewed') +
      StatusCountModule.countOf(this.filter, 'Profile Error');

    const MAX_DECIMAL_PRECISION = 2;
    let compliance = 0;
    if (controlCnt === 0) {
      this.outputData.compliance.level = '0%';
    } else {
      compliance =
        Math.trunc(
          Math.pow(10, MAX_DECIMAL_PRECISION) *
            ((StatusCountModule.countOf(this.filter, 'Passed') / controlCnt) *
              100)
        ) / Math.pow(10, MAX_DECIMAL_PRECISION);
      this.outputData.compliance.level = `${compliance.toFixed(
        MAX_DECIMAL_PRECISION
      )}%`;
    }

    if (compliance >= 90) {
      this.outputData.compliance.color = 'success'; // green
    } else if (compliance >= 60) {
      this.outputData.compliance.color = 'compliance-medium'; // yellow
    } else {
      this.outputData.compliance.color = 'danger'; // red
    }

    this.outputData.statistics = {
      passed: StatusCountModule.countOf(this.filter, 'Passed'),
      failed: StatusCountModule.countOf(this.filter, 'Failed'),
      notApplicable: StatusCountModule.countOf(this.filter, 'Not Applicable'),
      notReviewed: StatusCountModule.countOf(this.filter, 'Not Reviewed'),
      profileError: StatusCountModule.countOf(this.filter, 'Profile Error'),
      totalControls: controlCnt,
      passedTests: StatusCountModule.countOf(this.filter, 'PassedTests'),
      passingTestsFailedControl: StatusCountModule.countOf(
        this.filter,
        'PassingTestsFailedControl'
      ),
      failedTests: StatusCountModule.countOf(this.filter, 'FailedTests'),
      totalTests:
        StatusCountModule.countOf(this.filter, 'PassingTestsFailedControl') +
        StatusCountModule.countOf(this.filter, 'FailedTests')
    };
    this.outputData.severity = {
      low: SeverityCountModule.low(this.filter),
      medium: SeverityCountModule.medium(this.filter),
      high: SeverityCountModule.high(this.filter),
      critical: SeverityCountModule.critical(this.filter)
    };
    this.outputData.files = [];
    this.outputData.controlSets = [];
  }

  addDetails(
    control: ContextualizedControl,
    controlLevels: ContextualizedControl[]
  ): ContextualizedControl & {details: Detail[]} & {
    controlStatus: ControlStatus;
  } {
    // Check status of individual control to assign corresponding color
    let statusColor;
    switch (control.root.hdf.status) {
      case 'Passed':
        statusColor = 'success'; // green
        break;
      case 'Failed':
        statusColor = 'danger'; // red
        break;
      case 'Not Applicable':
        statusColor = 'info'; // blue
        break;
      case 'Not Reviewed':
        statusColor = 'warning'; // yellow
        break;
      case 'Profile Error':
        statusColor = 'error'; // purple
        break;
      default:
        statusColor = 'white';
    }

    return {
      ..._.set(
        control,
        'hdf.segments',
        ([] as HDFControlSegment[]).concat.apply(
          [],
          controlLevels.map((controlLevel) => controlLevel.hdf.segments || [])
        )
      ),
      full_code: control.full_code,
      details: [
        {
          name: 'Control',
          value: control.data.id
        },
        {
          name: 'Title',
          value: control.data.title
        },
        {
          name: 'Caveat',
          value: control.hdf.descriptions.caveat
        },
        {
          name: 'Desc',
          value: control.data.desc
        },
        {
          name: 'Rationale',
          value: control.hdf.descriptions.rationale
        },
        {
          name: 'Justification',
          value: control.hdf.descriptions.justification
        },
        {
          name: 'Severity',
          value: control.root.hdf.severity
        },
        {
          name: 'Impact',
          value: control.data.impact
        },
        {
          name: 'Nist controls',
          value: control.hdf.rawNistTags.join(', ')
        },
        {
          name: 'Check Text',
          value: control.hdf.descriptions.check || control.data.tags.check
        },
        {
          name: 'Fix Text',
          value: control.hdf.descriptions.fix || control.data.tags.fix
        }
      ].filter((v) => v.value),
      controlStatus: {
        status: control.root.hdf.status,
        color: statusColor
      }
    };
  }

  async exportHTML(): Promise<void> {
    this.resetOutputData();

    if (this.filter.fromFile.length === 0) {
      return SnackbarModule.failure('No files have been loaded.');
    }

    const templateRequest = await axios.get<string>(
      `/static/export/template.html`
    );
    for (const fileId of this.filter.fromFile) {
      const file = InspecDataModule.allFiles.find((f) => f.uniqueId === fileId);
      if (file) {
        this.addFiledata(file);
      }
    }

    const body = Mustache.render(templateRequest.data, this.outputData);
    saveAs(
      new Blob([s2ab(body)], {type: 'application/octet-stream'}),
      `${_.capitalize(
        this.exportType
      )}_Report_${new Date().toString()}.html`.replace(/[ :]/g, '_')
    );

    this.closeModal();
  }
}
</script>
