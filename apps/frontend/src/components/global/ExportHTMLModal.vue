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
        <v-row class="mb-1">
          <v-spacer />
          <v-btn @click="printHelp = true">
            Printing
            <v-icon class="ml-2"> mdi-help-circle </v-icon>
          </v-btn>
          <v-overlay :opacity="50" absolute="absolute" :value="printHelp">
            <div class="text-left mx-10">
              <p>
                Heimdall supports PDF and physical paper printing of results via
                HTML exports, which leverage custom stylings specifically
                tailored for PDF generation and physical print mediums. After
                downloading an HTML export of your results, use your browser's
                built-in print view (accessible through the browser's general
                drop-down menu or using the shortcut command CTRL + P
                (Windows)/CMD + P (MacOS)) to configure and print your PDF/paper
                copy.
              </p>
              <v-btn color="info" @click="printHelp = false"> Close </v-btn>
            </div>
          </v-overlay>
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

// Illegal characters which are not accepted by HTML id attribute
// Generally includes everything that is not alphanumeric or characters [-,_]
// Expand as needed
const ILLEGAL_CHAR_SET = {
  '\\.': '___PERIOD___'
};

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
  totalControls: number;
  passedTests: number;
  passingTestsFailedControl: number;
  failedTests: number;
  totalTests: number;
}

// Info used for profile control severity reporting; lvl 1
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

// Container for specific info on each control; lvl 2
interface Detail {
  name: string;
  value: string;
  class?: string;
}

// Status of a specific control; lvl 2
interface ControlStatus {
  status: string;
  color: string;
}

// Severity of a specific control; lvl 2
interface ControlSeverity {
  severity: string;
  color: string;
}

// Container for all controls; lvl 1
interface ControlSet {
  filename: string;
  fileID: string;
  controls: (ContextualizedControl & {details: Detail[]} & {
    controlID: string;
  } & {controlStatus: ControlStatus} & {controlSeverity: ControlSeverity} & {
    controlTags: string[];
  })[];
}

// All used icons; lvl 1
interface Icons {
  [key: string]: string;
}

// Top level interface; lvl 0
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

  // Default attributes
  showingModal = false;
  exportType = 'executive';
  description = 'Profile Info\nStatuses\nCompliance Level';
  printHelp = false;
  outputData: OutputData = {
    // Used for profile status reporting
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
    controlSets: [],
    showControlSets: false,
    showCode: false,
    exportType: '',
    // Series of icons used for profile-related detail reports
    icons: {
      // Passed
      circleCheck: this.iconDatatoSVG(
        mdiCheckCircle,
        'rgb(76, 176, 79)',
        'A green circle with a check'
      ), // green
      // Failed
      circleCross: this.iconDatatoSVG(
        mdiCloseCircle,
        'rgb(243, 67, 53)',
        'A red circle with a cross'
      ), // red
      // Not applicable
      circleMinus: this.iconDatatoSVG(
        mdiMinusCircle,
        'rgb(3, 169, 244)',
        'A blue circle with a minus'
      ), // blue
      // Not reviewed
      circleAlert: this.iconDatatoSVG(
        mdiAlertCircle,
        'rgb(254, 153, 0)',
        'A yellow circle with an exclamation point'
      ), // yellow
      // Profile error
      triangleAlert: this.iconDatatoSVG(
        mdiAlert,
        'rgb(121, 134, 203)',
        'A purple triangle with an exclamation point'
      ), // purple
      // Total count
      squareEqual: this.iconDatatoSVG(
        mdiEqualBox,
        'black',
        'A black square with an equal'
      ),
      // No severity
      circleNone: this.iconDatatoSVG(
        mdiCircle,
        'rgb(3, 169, 244)',
        'A blue circle'
      ),
      // Low severity
      circleLow: this.iconDatatoSVG(
        mdiCircle,
        'rgb(255, 235, 59)',
        'A yellow circle'
      ), // yellow
      // Medium severity
      circleMedium: this.iconDatatoSVG(
        mdiCircle,
        'rgb(255, 152, 0)',
        'An orange circle'
      ), // orange
      // High severity
      circleHigh: this.iconDatatoSVG(
        mdiCircle,
        'rgb(255, 87, 34)',
        'A deep orange circle'
      ), // deep orange
      // Critical severity
      circleCritical: this.iconDatatoSVG(
        mdiCircle,
        'rgb(244, 67, 54)',
        'A red circle'
      ) // red
    }
  };

  // Configures outputData object's report type based on user input
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

  // Generate SVG HTML for icons for injection into export template
  iconDatatoSVG(
    iconData: string,
    fill: string,
    desc: string,
    widthPx = 24,
    heightPx = 24
  ): string {
    return `<svg style="width:${widthPx}px; height:${heightPx}px" viewBox="0 0 ${widthPx} ${heightPx}" role="img" title="${desc}" aria-label="${desc}"><path fill="${fill}" d="${iconData}"/></svg>`;
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

  // Takes all available existing file data to use as default settings/data for outputData object
  resetOutputData() {
    // Total control count
    const controlCnt =
      StatusCountModule.countOf(this.filter, 'Passed') +
      StatusCountModule.countOf(this.filter, 'Failed') +
      StatusCountModule.countOf(this.filter, 'Not Applicable') +
      StatusCountModule.countOf(this.filter, 'Not Reviewed') +
      StatusCountModule.countOf(this.filter, 'Profile Error');

    // Calculate & set compliance level from control statuses
    const MAX_DECIMAL_PRECISION = 2;
    let compliance = 0;
    // If controls exist, calculate compliance level
    if (controlCnt > 0) {
      // Formula: compliance = Passed/(Passed + Failed + Not Reviewed + Profile Error) * 100
      // Truncate to hundredths decimal place
      const calculatedCompliance =
        Math.trunc(
          Math.pow(10, MAX_DECIMAL_PRECISION) *
            ((StatusCountModule.countOf(this.filter, 'Passed') /
              (controlCnt -
                StatusCountModule.countOf(this.filter, 'Not Applicable'))) *
              100)
        ) / Math.pow(10, MAX_DECIMAL_PRECISION);
      // Check if calculated compliance is valid
      if (!isNaN(calculatedCompliance)) {
        // Check if calculated compliance is a natural number
        if (calculatedCompliance >= 0) {
          compliance = calculatedCompliance;
        }
      }
    }
    this.outputData.compliance.level = `${compliance.toFixed(
      MAX_DECIMAL_PRECISION
    )}%`;

    // Set coloring for compliance based on level of compliance
    if (compliance >= 90) {
      this.outputData.compliance.color = 'high'; // green
    } else if (compliance >= 60) {
      this.outputData.compliance.color = 'medium'; // yellow
    } else {
      this.outputData.compliance.color = 'low'; // red
    }

    // Set following attributes from existing file data
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
      none: SeverityCountModule.none(this.filter),
      low: SeverityCountModule.low(this.filter),
      medium: SeverityCountModule.medium(this.filter),
      high: SeverityCountModule.high(this.filter),
      critical: SeverityCountModule.critical(this.filter)
    };
    this.outputData.files = [];
    this.outputData.controlSets = [];
  }

  // Replace all found illegal characters in string with compliant string equivalent
  replaceIllegalChar(text: string): string {
    for (const illegalChar in ILLEGAL_CHAR_SET) {
      text = text.replace(
        new RegExp(`${illegalChar}`, 'g'),
        ILLEGAL_CHAR_SET[illegalChar as keyof typeof ILLEGAL_CHAR_SET]
      );
    }
    return text;
  }

  // Sets attributes for each specific control
  addDetails(
    control: ContextualizedControl,
    controlLevels: ContextualizedControl[]
  ): ContextualizedControl & {details: Detail[]} & {controlID: string} & {
    controlStatus: ControlStatus;
  } & {controlSeverity: ControlSeverity} & {controlTags: string[]} {
    // Check status of individual control to assign corresponding color
    let statusColor;
    switch (control.root.hdf.status) {
      case 'Passed':
        statusColor = this.iconDatatoSVG(
          mdiCheckCircle,
          'rgb(76, 176, 79)',
          'A green circle with a check'
        ); // green
        break;
      case 'Failed':
        statusColor = this.iconDatatoSVG(
          mdiCloseCircle,
          'rgb(243, 67, 53)',
          'A red circle with a cross'
        ); // red
        break;
      case 'Not Applicable':
        statusColor = this.iconDatatoSVG(
          mdiMinusCircle,
          'rgb(3, 169, 244)',
          'A blue circle with a minus'
        ); // blue
        break;
      case 'Not Reviewed':
        statusColor = this.iconDatatoSVG(
          mdiAlertCircle,
          'rgb(254, 153, 0)',
          'A yellow circle with an exclamation point'
        ); // yellow
        break;
      case 'Profile Error':
        statusColor = this.iconDatatoSVG(
          mdiAlert,
          'rgb(121, 134, 203)',
          'A purple triangle with an exclamation point'
        ); // purple
        break;
      default:
        statusColor = this.iconDatatoSVG(
          mdiCircle,
          'rgb(0, 0, 0)',
          'A white circle'
        );
    }

    // Severity is recorded as all lowercase by default; for aesthetic purposes, uppercase the first letter
    const severity =
      control.root.hdf.severity[0].toUpperCase() +
      control.root.hdf.severity.slice(1);
    // Check severity of individual control to assign corresponding color
    let severityColor;
    switch (control.root.hdf.severity) {
      case 'none':
        severityColor = this.iconDatatoSVG(
          mdiCircle,
          'rgb(3, 169, 244)',
          'A blue circle'
        ); // blue
        break;
      case 'low':
        severityColor = this.iconDatatoSVG(
          mdiCircle,
          'rgb(255, 235, 59)',
          'A yellow circle'
        ); // yellow
        break;
      case 'medium':
        severityColor = this.iconDatatoSVG(
          mdiCircle,
          'rgb(255, 152, 0)',
          'An orange circle'
        ); // orange
        break;
      case 'high':
        severityColor = this.iconDatatoSVG(
          mdiCircle,
          'rgb(255, 87, 34)',
          'A deep orange circle'
        ); // deep orange
        break;
      case 'critical':
        severityColor = this.iconDatatoSVG(
          mdiCircle,
          'rgb(244, 67, 54)',
          'A red circle'
        ); // red
        break;
      default:
        severityColor = this.iconDatatoSVG(
          mdiCircle,
          'rgb(0, 0, 0)',
          'A white circle'
        );
    }

    // Grab NIST & CCI controls
    const allControls = _.filter(
      [control.hdf.rawNistTags, control.hdf.wraps.tags.cci],
      Boolean
    ).flat();
    // Remove `Rev_4` item and replace `unmapped` with proper `UM-1` naming
    const filteredControls = allControls
      .map((control) => (control === 'unmapped' ? 'UM-1' : control))
      .filter((control) => control !== 'Rev_4');

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
      controlID: this.replaceIllegalChar(control.hdf.wraps.id),
      controlStatus: {
        status: control.root.hdf.status,
        color: statusColor
      },
      controlSeverity: {
        severity: severity,
        color: severityColor
      },
      controlTags: filteredControls
    };
  }

  async exportHTML(): Promise<void> {
    this.resetOutputData();

    if (this.filter.fromFile.length === 0) {
      return SnackbarModule.failure('No files have been loaded.');
    }

    // Pull export template and create outputData object containing data to fill template with
    const templateRequest = await axios.get<string>(
      `/static/export/template.html`
    );
    for (const fileId of this.filter.fromFile) {
      const file = InspecDataModule.allFiles.find((f) => f.uniqueId === fileId);
      if (file) {
        this.addFiledata(file);
      }
    }

    // Render template and export generated HTML file
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
