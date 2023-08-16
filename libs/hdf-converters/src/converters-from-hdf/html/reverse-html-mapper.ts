import {
  mdiAlert,
  mdiAlertCircle,
  mdiCheckCircle,
  mdiCircle,
  mdiCloseCircle,
  mdiEqualBox,
  mdiMinusCircle
} from '@mdi/js';
import axios from 'axios';
import {ContextualizedControl} from 'inspecjs';

// Illegal characters which are not accepted by HTML id attribute
// Generally includes everything that is not alphanumeric or characters [-,_]
// Expand as needed
const ILLEGAL_CHARACTER_SET = [['\\.', '___PERIOD___']];

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

export class FromHDFToHTMLMapper {
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

  // Generate SVG HTML for icons for injection into export template
  iconDataToSVG(
    iconData: string,
    fill: string,
    widthPx = 24,
    heightPx = 24,
    description?: string
  ): string {
    let imgLabel;
    if (description) {
      imgLabel = `title="${description}" aria-label="${description}"`;
    } else {
      imgLabel = `aria-hidden="true"`;
    }
    return `<svg style="width:${widthPx}px; height:${heightPx}px" viewBox="0 0 ${widthPx} ${heightPx}" role="img" ${imgLabel}><path fill="${fill}" d="${iconData}"/></svg>`;
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

  async toHTML() {
    const templateRequest = axios.get<string>(`template.html`);
    const tailwindStylesRequest = axios.get<string>('style.css');
    const tailwindElementsRequest = axios.get<string>('tw-elements.min.js');

    const responses = await axios.all([
      templateRequest,
      tailwindStylesRequest,
      tailwindElementsRequest
    ]);

    const template = responses[0].data;
  }
}
