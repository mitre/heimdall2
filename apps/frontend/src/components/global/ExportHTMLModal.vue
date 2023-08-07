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
import {
  formatCompliance,
  translateCompliance
} from '@/utilities/compliance_util';

// Illegal characters which are not accepted by HTML id attribute
// Generally includes everything that is not alphanumeric or characters [-,_]
// Expand as needed
const ILLEGAL_CHARACTER_SET = [['\\.', '___PERIOD___']];

// All selectable export types for an HTML export
const enum FileExportTypes {
  Executive = 'executive',
  Manager = 'manager',
  Administrator = 'administrator'
}

// All corresponding descriptions for export types
const enum FileExportDescriptions {
  Executive = 'Profile Info\nStatuses\nCompliance Level',
  Manager = 'Profile Info\nStatuses\nCompliance Level\nTest Results and Details',
  Administrator = 'Profile Info\nStatuses\nCompliance Level\nTest Results and Details\nTest Code'
}

// =====================================
// TEMPLATE RENDER DATA INTERFACES START
// =====================================

// Basic info for exported files; lvl 1
interface FileInfo {
  filename: string;
  toolVersion: string;
  platform: string;
  duration: string;
}

// Info used for profile status reporting; lvl 1
interface Statistics {
  passed: number;
  failed: number;
  notApplicable: number;
  notReviewed: number;
  profileError: number;
  totalResults: number;
  passedTests: number;
  passingTestsFailedResult: number;
  failedTests: number;
  totalTests: number;
}

// Info used for profile result severity reporting; lvl 1
interface Severity {
  none: number;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

// Info used for profile compliance reporting; lvl 1
interface Compliance {
  level: string;
  color: string;
}

// Container for specific info on each result; lvl 2
interface Detail {
  name: string;
  value: string;
  class?: string;
}

// Status of a specific result; lvl 2
interface ResultStatus {
  status: string;
  icon: string;
}

// Severity of a specific result; lvl 2
interface ResultSeverity {
  severity: string;
  icon: string;
}

// Container for all results; lvl 1
interface ResultSet {
  filename: string;
  fileID: string;
  results: (ContextualizedControl & {details: Detail[]} & {
    resultID: string;
  } & {resultStatus: ResultStatus} & {resultSeverity: ResultSeverity} & {
    controlTags: string[];
  })[];
}

// All used icons; lvl 1
interface Icons {
  [key: string]: string;
}

// Top level interface; lvl 0
interface OutputData {
  tailwindStyles: string;
  tailwindElements: string;
  files: FileInfo[];
  statistics: Statistics;
  severity: Severity;
  compliance: Compliance;
  resultSets: ResultSet[];
  showResultSets: boolean;
  showCode: boolean;
  exportType: string;
  icons: Icons;
}

// ===================================
// TEMPLATE RENDER DATA INTERFACES END
// ===================================

@Component({
  components: {
    LinkItem
  }
})
export default class ExportHTMLModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  // If we are exporting a profile we can remove the test/results table
  @Prop({type: String, required: true}) readonly fileType!: string;

  // Generated injectable HTML for icons
  // NOTE: Icons colors should align with Vue colors used in general dashboard from apps/frontend/src/store/color_hack.ts
  // ARIA NOTE: Since icons are supplementary, descriptions are not required
  private iconHTMLStore = {
    // Passed; green
    circleCheck: this.iconDataToSVG(mdiCheckCircle, 'rgb(76, 176, 79)'),
    // Failed; red
    circleCross: this.iconDataToSVG(mdiCloseCircle, 'rgb(243, 67, 53)'),
    // Not applicable; blue
    circleMinus: this.iconDataToSVG(mdiMinusCircle, 'rgb(3, 169, 244)'),
    // Not reviewed; yellow
    circleAlert: this.iconDataToSVG(mdiAlertCircle, 'rgb(254, 153, 0)'),
    // Profile error; purple
    triangleAlert: this.iconDataToSVG(mdiAlert, 'rgb(121, 134, 203)'),
    // Total count; black
    squareEqual: this.iconDataToSVG(mdiEqualBox, 'black'),
    // No severity; blue
    circleNone: this.iconDataToSVG(mdiCircle, 'rgb(3, 169, 244)'),
    // Low severity; yellow
    circleLow: this.iconDataToSVG(mdiCircle, 'rgb(255, 235, 59)'),
    // Medium severity; orange
    circleMedium: this.iconDataToSVG(mdiCircle, 'rgb(255, 152, 0)'),
    // High severity; deep orange
    circleHigh: this.iconDataToSVG(mdiCircle, 'rgb(255, 87, 34)'),
    // Critical severity; red
    circleCritical: this.iconDataToSVG(mdiCircle, 'rgb(244, 67, 54)'),
    // Generic circle
    circleWhite: this.iconDataToSVG(mdiCircle, 'rgb(0, 0, 0)')
  };

  // Default attributes
  showingModal = false;
  exportType = FileExportTypes.Executive;
  description = FileExportDescriptions.Executive;
  printHelp = false;
  outputData: OutputData = {
    tailwindStyles: '',
    tailwindElements: '',
    // Used for profile status reporting
    statistics: {
      passed: 0,
      failed: 0,
      notApplicable: 0,
      notReviewed: 0,
      profileError: 0,
      totalResults: 0,
      passedTests: 0,
      passingTestsFailedResult: 0,
      failedTests: 0,
      totalTests: 0
    },
    // Used for profile severity reporting
    severity: {
      none: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    // Used for profile compliance reporting
    compliance: {
      level: '',
      color: ''
    },
    files: [],
    resultSets: [],
    showResultSets: false,
    showCode: false,
    exportType: '',
    // Series of icons used for profile-related detail reports
    icons: {
      // Passed
      circleCheck: this.iconHTMLStore.circleCheck,
      // Failed
      circleCross: this.iconHTMLStore.circleCross,
      // Not applicable
      circleMinus: this.iconHTMLStore.circleMinus,
      // Not reviewed
      circleAlert: this.iconHTMLStore.circleAlert,
      // Profile error
      triangleAlert: this.iconHTMLStore.triangleAlert,
      // Total count
      squareEqual: this.iconHTMLStore.squareEqual,
      // No severity
      circleNone: this.iconHTMLStore.circleNone,
      // Low severity
      circleLow: this.iconHTMLStore.circleLow,
      // Medium severity
      circleMedium: this.iconHTMLStore.circleMedium,
      // High severity
      circleHigh: this.iconHTMLStore.circleHigh,
      // Critical severity
      circleCritical: this.iconHTMLStore.circleCritical
    }
  };

  // Configures outputData object's report type based on user input
  @Watch('exportType')
  onExportTypeChanged(newValue: string) {
    switch (newValue) {
      case FileExportTypes.Executive:
        this.description = FileExportDescriptions.Executive;
        this.outputData.showResultSets = false;
        this.outputData.showCode = false;
        break;
      case FileExportTypes.Manager:
        this.description = FileExportDescriptions.Manager;
        this.outputData.showResultSets = true;
        this.outputData.showCode = false;
        break;
      case FileExportTypes.Administrator:
        this.description = FileExportDescriptions.Administrator;
        this.outputData.showResultSets = true;
        this.outputData.showCode = true;
        break;
    }
  }

  // Generate SVG HTML for icons for injection into export template
  iconDataToSVG(
    iconData: string,
    fill: string,
    description = 'None',
    widthPx = 24,
    heightPx = 24
  ): string {
    if (description === 'None') {
      return `<svg style="width:${widthPx}px; height:${heightPx}px" viewBox="0 0 ${widthPx} ${heightPx}" role="img" aria-hidden="true"><path fill="${fill}" d="${iconData}"/></svg>`;
    } else {
      return `<svg style="width:${widthPx}px; height:${heightPx}px" viewBox="0 0 ${widthPx} ${heightPx}" role="img" title="${description}" aria-label="${description}"><path fill="${fill}" d="${iconData}"/></svg>`;
    }
  }

  // Invoked when file(s) are loaded.
  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
  }

  // Pulls and sets high level attributes of outputData object from file data
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
    const allResultLevels = FilteredDataModule.controls({
      ...this.filter,
      fromFile: [file.uniqueId],
      omit_overlayed_controls: false
    });
    const results = FilteredDataModule.controls({
      ...this.filter,
      fromFile: [file.uniqueId],
      omit_overlayed_controls: true
    });
    // Convert them into rows
    this.outputData.resultSets.push({
      filename: file.filename,
      fileID: file.uniqueId,
      results: results.map((result) =>
        this.addDetails(
          result,
          allResultLevels.filter(
            (searchingResult) => searchingResult.data.id === result.data.id
          )
        )
      )
    });
  }

  // Takes all available existing file data to use as default settings/data for outputData object
  resetOutputData() {
    // Total result count
    const resultCount =
      StatusCountModule.countOf(this.filter, 'Passed') +
      StatusCountModule.countOf(this.filter, 'Failed') +
      StatusCountModule.countOf(this.filter, 'Not Applicable') +
      StatusCountModule.countOf(this.filter, 'Not Reviewed') +
      StatusCountModule.countOf(this.filter, 'Profile Error');

    // Calculate & set compliance level and color from result statuses
    // Set default complaince level and color
    this.outputData.compliance.level = '0.00%';
    this.outputData.compliance.color = 'low';
    // If results exist, calculate compliance level
    if (resultCount > 0) {
      // Formula: compliance = Passed/(Passed + Failed + Not Reviewed + Profile Error) * 100
      const complianceLevel = formatCompliance(
        (StatusCountModule.countOf(this.filter, 'Passed') /
          (resultCount -
            StatusCountModule.countOf(this.filter, 'Not Applicable'))) *
          100
      );
      // Set compliance level
      this.outputData.compliance.level = complianceLevel;
      // Determine color of compliance level
      // High compliance is green, medium is yellow, low is red
      this.outputData.compliance.color = translateCompliance(complianceLevel);
    }

    // Set following attributes from existing file data
    this.outputData.statistics = {
      passed: StatusCountModule.countOf(this.filter, 'Passed'),
      failed: StatusCountModule.countOf(this.filter, 'Failed'),
      notApplicable: StatusCountModule.countOf(this.filter, 'Not Applicable'),
      notReviewed: StatusCountModule.countOf(this.filter, 'Not Reviewed'),
      profileError: StatusCountModule.countOf(this.filter, 'Profile Error'),
      totalResults: resultCount,
      passedTests: StatusCountModule.countOf(this.filter, 'PassedTests'),
      passingTestsFailedResult: StatusCountModule.countOf(
        this.filter,
        'PassingTestsFailedControl'
      ),
      failedTests: StatusCountModule.countOf(this.filter, 'FailedTests'),
      totalTests:
        StatusCountModule.countOf(this.filter, 'PassingTestsFailedControl') +
        StatusCountModule.countOf(this.filter, 'FailedTests')
    };
    this.outputData.severity = {
      none: SeverityCountModule.none(this.filter),
      low: SeverityCountModule.low(this.filter),
      medium: SeverityCountModule.medium(this.filter),
      high: SeverityCountModule.high(this.filter),
      critical: SeverityCountModule.critical(this.filter)
    };
    this.outputData.files = [];
    this.outputData.resultSets = [];
  }

  // Replace all found illegal characters in string with compliant string equivalent
  replaceIllegalCharacters(text: string): string {
    for (const illegalCharacter of ILLEGAL_CHARACTER_SET) {
      text = text.replace(
        new RegExp(`${illegalCharacter[0]}`, 'g'),
        illegalCharacter[1]
      );
    }
    return text;
  }

  // Sets attributes for each specific result
  addDetails(
    result: ContextualizedControl,
    resultLevels: ContextualizedControl[]
  ): ContextualizedControl & {details: Detail[]} & {resultID: string} & {
    resultStatus: ResultStatus;
  } & {resultSeverity: ResultSeverity} & {controlTags: string[]} {
    // Check status of individual result to assign corresponding icon
    let statusColor;
    switch (result.root.hdf.status) {
      case 'Passed':
        statusColor = this.iconHTMLStore.circleCheck;
        break;
      case 'Failed':
        statusColor = this.iconHTMLStore.circleCross;
        break;
      case 'Not Applicable':
        statusColor = this.iconHTMLStore.circleMinus;
        break;
      case 'Not Reviewed':
        statusColor = this.iconHTMLStore.circleAlert;
        break;
      case 'Profile Error':
        statusColor = this.iconHTMLStore.triangleAlert;
        break;
      default:
        statusColor = this.iconHTMLStore.circleWhite;
    }

    // Severity is recorded as all lowercase by default; for aesthetic purposes, uppercase the first letter
    const severity = _.capitalize(result.root.hdf.severity);
    // Check severity of individual result to assign corresponding icon
    let severityColor;
    switch (result.root.hdf.severity) {
      case 'none':
        severityColor = this.iconHTMLStore.circleNone;
        break;
      case 'low':
        severityColor = this.iconHTMLStore.circleLow;
        break;
      case 'medium':
        severityColor = this.iconHTMLStore.circleMedium;
        break;
      case 'high':
        severityColor = this.iconHTMLStore.circleHigh;
        break;
      case 'critical':
        severityColor = this.iconHTMLStore.circleCritical;
        break;
      default:
        severityColor = this.iconHTMLStore.circleWhite;
    }

    // Grab NIST & CCI controls
    const allControls = _.filter(
      [result.hdf.rawNistTags, result.hdf.wraps.tags.cci],
      Boolean
    ).flat();
    // Remove `Rev_4` item and replace `unmapped` with proper `UM-1` naming
    const filteredControls = allControls
      .map((control) => (control === 'unmapped' ? 'UM-1' : control))
      .filter((control) => control !== 'Rev_4');

    return {
      ..._.set(
        result,
        'hdf.segments',
        ([] as HDFControlSegment[]).concat.apply(
          [],
          resultLevels.map((resultLevel) => resultLevel.hdf.segments || [])
        )
      ),
      full_code: result.full_code,
      details: [
        {
          name: 'Control',
          value: result.data.id
        },
        {
          name: 'Title',
          value: result.data.title
        },
        {
          name: 'Caveat',
          value: result.hdf.descriptions.caveat
        },
        {
          name: 'Desc',
          value: result.data.desc
        },
        {
          name: 'Rationale',
          value: result.hdf.descriptions.rationale
        },
        {
          name: 'Justification',
          value: result.hdf.descriptions.justification
        },
        {
          name: 'Severity',
          value: result.root.hdf.severity
        },
        {
          name: 'Impact',
          value: result.data.impact
        },
        {
          name: 'Nist Controls',
          value: result.hdf.rawNistTags.join(', ')
        },
        {
          name: 'Check Text',
          value: result.hdf.descriptions.check || result.data.tags.check
        },
        {
          name: 'Fix Text',
          value: result.hdf.descriptions.fix || result.data.tags.fix
        }
      ].filter((v) => v.value),
      resultID: this.replaceIllegalCharacters(result.hdf.wraps.id),
      resultStatus: {
        status: result.root.hdf.status,
        icon: statusColor
      },
      resultSeverity: {
        severity: severity,
        icon: severityColor
      },
      controlTags: filteredControls
    };
  }

  async exportHTML(): Promise<void> {
    this.resetOutputData();

    if (this.filter.fromFile.length === 0) {
      return SnackbarModule.failure('No files have been loaded.');
    }

    // Pull export template + styles and create outputData object containing data to fill template with
    const templateRequest = axios.get<string>(`/static/export/template.html`);
    const tailwindStylesRequest = axios.get<string>('/static/export/style.css');
    const tailwindElementsRequest = axios.get<string>(
      '/static/export/tw-elements.min.js'
    );
    const responses = await axios.all([
      templateRequest,
      tailwindStylesRequest,
      tailwindElementsRequest
    ]);

    const template = responses[0].data;
    this.outputData.tailwindStyles = responses[1].data;
    this.outputData.tailwindElements = responses[2].data;

    for (const fileId of this.filter.fromFile) {
      const file = InspecDataModule.allFiles.find((f) => f.uniqueId === fileId);
      if (file) {
        this.addFiledata(file);
      }
    }

    // Render template and export generated HTML file
    const body = Mustache.render(template, this.outputData);
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
