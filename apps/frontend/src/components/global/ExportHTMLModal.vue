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
  mdiMinusCircle
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

interface Detail {
  name: string;
  value: string;
  class?: string;
}

interface FileInfo {
  filename: string;
  toolVersion: string;
  platform: string;
  duration: string;
}

interface ControlSet {
  filename: string;
  fileID: string;
  controls: (ContextualizedControl & {details: Detail[]})[];
}

interface Statistics {
  passed: number;
  failed: number;
  notApplicable: number;
  notReviewed: number;
  passedTests: number;
  passingTestsFailedControl: number;
  failedTests: number;
  totalTests: number;
}

interface Icons {
  [key: string]: string;
}

interface OutputData {
  bootstrapCSS: string;
  bootstrapJS: string;
  jquery: string;
  files: FileInfo[];
  statistics: Statistics;
  controlSets: ControlSet[];
  showControlSets: boolean;
  showCode: boolean;
  exportType: string;
  complianceCards: {html: string | undefined}[];
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
  description = 'Profile Info\nStatuses\nCompliance Donuts';
  outputData: OutputData = {
    bootstrapCSS: '',
    bootstrapJS: '',
    jquery: '',
    statistics: {
      passed: 0,
      failed: 0,
      notApplicable: 0,
      notReviewed: 0,
      passedTests: 0,
      passingTestsFailedControl: 0,
      failedTests: 0,
      totalTests: 0
    },
    files: [],
    controlSets: [],
    showControlSets: false,
    showCode: false,
    exportType: '',
    complianceCards: [],
    icons: {
      circleCheck: this.iconDatatoSVG(mdiCheckCircle, 'white'),
      circleCross: this.iconDatatoSVG(mdiCloseCircle, 'white'),
      circleMinus: this.iconDatatoSVG(mdiMinusCircle, 'white'),
      circleAlert: this.iconDatatoSVG(mdiAlertCircle, 'white')
    }
  };

  @Watch('exportType')
  onFileChanged(newValue: string, _oldValue: string) {
    switch (newValue) {
      case 'executive':
        this.description = 'Profile Info\nStatuses\nCompliance Donuts';
        this.outputData.showControlSets = false;
        this.outputData.showCode = false;
        break;
      case 'manager':
        this.description =
          'Profile Info\nStatuses\nCompliance Donuts\nTest Results and Details';
        this.outputData.showControlSets = true;
        this.outputData.showCode = false;
        break;
      case 'administrator':
        this.description =
          'Profile Info\nStatuses\nCompliance Donuts\nTest Results and Details\nTest Code';
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
      toolVersion: _.get(file, 'evaluation.data.version'),
      platform: _.get(file, 'evaluation.data.platform.name'),
      duration: _.get(file, 'evaluation.data.statistics.duration')
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
    this.outputData.statistics = {
      passed: StatusCountModule.countOf(this.filter, 'Passed'),
      failed: StatusCountModule.countOf(this.filter, 'Failed'),
      notApplicable: StatusCountModule.countOf(this.filter, 'Not Applicable'),
      notReviewed: StatusCountModule.countOf(this.filter, 'Not Reviewed'),
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
    this.outputData.files = [];
    this.outputData.controlSets = [];
  }

  addDetails(
    control: ContextualizedControl,
    controlLevels: ContextualizedControl[]
  ): ContextualizedControl & {details: Detail[]} {
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
      ].filter((v) => v.value)
    };
  }

  exportHTML(): void {
    this.resetOutputData();
    if (this.filter.fromFile.length === 0) {
      return SnackbarModule.failure('No files have been loaded.');
    }
    const templateRequest = axios.get<string>(`/static/export/template.html`);
    const bootstrapCSSRequest = axios.get<string>(
      `/static/export/bootstrap.min.css`
    );
    const bootstrapJSRequest = axios.get<string>(
      `/static/export/bootstrap.min.js`
    );
    const jqueryRequest = axios.get<string>(`/static/export/jquery.min.js`);

    axios
      .all([
        templateRequest,
        bootstrapCSSRequest,
        bootstrapJSRequest,
        jqueryRequest
      ])
      .then(
        axios.spread((...responses) => {
          const template = responses[0].data;
          this.outputData.bootstrapCSS = responses[1].data
            .replace('220,53,69', '243,67,53') // bg-danger
            .replace('25,135,84', '76,176,79') // bg-success
            .replace('13,202,240', '3,169,244') // bg-info
            .replace('255,193,7', '254,153,0'); // bg-warning

          this.outputData.bootstrapJS = responses[2].data;
          this.outputData.jquery = responses[3].data;
          this.outputData.complianceCards = [
            {html: document.getElementById('statusCounts')?.innerHTML},
            {html: document.getElementById('severityCounts')?.innerHTML},
            {html: document.getElementById('complianceLevel')?.innerHTML}
          ];

          this.filter.fromFile.forEach(async (fileId) => {
            const file = InspecDataModule.allFiles.find(
              (f) => f.uniqueId === fileId
            );
            if (file) {
              this.addFiledata(file);
            }
          });
          const body = Mustache.render(template, this.outputData);
          saveAs(
            new Blob([s2ab(body)], {type: 'application/octet-stream'}),
            `${_.capitalize(
              this.exportType
            )}_Report_${new Date().toString()}.html`.replace(/[ :]/g, '_')
          );
        })
      );
    this.closeModal();
  }
}
</script>
