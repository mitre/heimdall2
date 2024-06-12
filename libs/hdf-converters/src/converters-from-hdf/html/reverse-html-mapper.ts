import {
  mdiAlert,
  mdiAlertCircle,
  mdiCheckCircle,
  mdiCircle,
  mdiCloseCircle,
  mdiEqualBox,
  mdiMinusCircle
} from '@mdi/js';
import fs from 'fs';
import {
  ContextualizedControl,
  ContextualizedEvaluation,
  convertFileContextual,
  HDFControlSegment,
  isContextualizedEvaluation
} from 'inspecjs';
import * as _ from 'lodash';
import Mustache from 'mustache';
import {formatCompliance, translateCompliance} from '../../utils/compliance';
import {
  IDetail,
  IOutputData,
  IResultSeverity,
  IResultStatus
} from './html-types';
import path from 'path';
import axios from 'axios';

type InputData = {
  data: ContextualizedEvaluation | string;
  fileName: string;
  fileID: string;
  filteredControls?: string[];
};

type ProcessedData = {
  data: ContextualizedEvaluation;
  fileName: string;
  fileID: string;
  filteredControls?: string[];
};

// All selectable export types for an HTML export
export enum FileExportTypes {
  Executive = 'Executive',
  Manager = 'Manager',
  Administrator = 'Administrator'
}

// Illegal characters which are not accepted by HTML id attribute
// Generally includes everything that is not alphanumeric or characters [-,_]
// Expand as needed
const ILLEGAL_CHARACTER_SET = [['\\.', '___PERIOD___']];

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
  outputData: IOutputData = {
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

  constructor(files: InputData[], exportType: FileExportTypes) {
    // Set html element visibility based on export type
    switch (exportType) {
      case FileExportTypes.Executive:
        this.outputData.showResultSets = false;
        this.outputData.showCode = false;
        break;
      case FileExportTypes.Manager:
        this.outputData.showResultSets = true;
        this.outputData.showCode = false;
        break;
      case FileExportTypes.Administrator:
        this.outputData.showResultSets = true;
        this.outputData.showCode = true;
    }

    // Set default attribute values in preparation for value assignment
    this.outputData.files = [];
    this.outputData.resultSets = [];

    // Fill out data template for html file using received hdf file(s)
    for (const file of files) {
      // Check if provided data is string typed
      if (_.isString(file.data)) {
        const contextualizedFile = convertFileContextual(file.data);
        if (!isContextualizedEvaluation(contextualizedFile)) {
          throw new Error('Input string was not an HDF ExecJSON');
        }
        file.data = contextualizedFile;
      }

      this.addFiledata(
        {
          data: file.data,
          fileName: file.fileName,
          fileID: file.fileID,
          filteredControls: file.filteredControls
        },
        exportType
      );
    }
  }

  // Pulls and sets high level attributes of outputData object from file data
  addFiledata(file: ProcessedData, exportType: FileExportTypes) {
    // Set file profile data
    this.outputData.files.push({
      filename: file.fileName,
      toolVersion: _.get(file.data, 'data.version') as unknown as string,
      platform: _.get(file.data, 'data.platform.name') as unknown as string,
      duration: _.get(
        file.data,
        'data.statistics.duration'
      ) as unknown as string
    });

    // Set export type
    // Controls what components are shown in HTML
    this.outputData.exportType = exportType;

    // Pull out results from file
    const allResultLevels: ContextualizedControl[] = [];
    if (file.filteredControls === undefined) {
      file.data.contains.map((profile) => {
        profile.contains.map((result) => {
          allResultLevels.push(result);
        });
      });
    } else {
      file.data.contains.flatMap((profile) => {
        profile.contains.flatMap((result) => {
          // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
          for (const element of file.filteredControls!) {
            if (element === result.data.id) {
              allResultLevels.push(result);
            }
          }
        });
      });
    }

    // Begin filling out outpuData object to pass into HTML template
    // Set high level generalized profile details
    this.addProfileDetails(allResultLevels);

    // Set specific result details
    this.outputData.resultSets.push({
      filename: file.fileName,
      fileID: file.fileID,
      results: allResultLevels.map((result) =>
        this.addResultDetails(
          result,
          allResultLevels.filter(
            (searchingResult) => searchingResult.data.id === result.data.id
          )
        )
      )
    });
  }

  // Set attributes for high level generalized profile details
  addProfileDetails(results: ContextualizedControl[]) {
    let passed = 0;
    let failed = 0;
    let notApplicable = 0;
    let notReviewed = 0;
    let profileError = 0;
    let none = 0;
    let low = 0;
    let medium = 0;
    let high = 0;
    let critical = 0;
    let passedTests = 0;
    let failedTests = 0;
    let passingTestsFailedResult = 0;
    // Count out statuses and sub-statuses
    for (const result of results) {
      switch (result.root.hdf.status) {
        case 'Passed':
          passed++;
          passedTests += (result.root.hdf.segments || []).length;
          break;
        case 'Failed':
          failed++;
          passingTestsFailedResult += (result.root.hdf.segments || []).filter(
            (subStatus) => subStatus.status === 'passed'
          ).length;
          failedTests += (result.root.hdf.segments || []).filter(
            (subStatus) => subStatus.status === 'failed'
          ).length;
          break;
        case 'Not Applicable':
          notApplicable++;
          break;
        case 'Not Reviewed':
          notReviewed++;
          break;
        case 'Profile Error':
          profileError++;
      }
      // Count out severities
      switch (result.root.hdf.severity) {
        case 'none':
          none++;
          break;
        case 'low':
          low++;
          break;
        case 'medium':
          medium++;
          break;
        case 'high':
          high++;
          break;
        case 'critical':
          critical++;
      }
    }

    // Set following attributes from existing file data
    this.outputData.statistics = {
      passed: this.outputData.statistics.passed + passed,
      failed: this.outputData.statistics.failed + failed,
      notApplicable: this.outputData.statistics.notApplicable + notApplicable,
      notReviewed: this.outputData.statistics.notReviewed + notReviewed,
      profileError: this.outputData.statistics.profileError + profileError,
      totalResults: this.outputData.statistics.totalResults + results.length,
      passedTests: this.outputData.statistics.passedTests + passedTests,
      passingTestsFailedResult:
        this.outputData.statistics.passingTestsFailedResult +
        passingTestsFailedResult,
      failedTests: this.outputData.statistics.failedTests + failedTests,
      totalTests:
        this.outputData.statistics.totalTests +
        passingTestsFailedResult +
        failedTests
    };
    this.outputData.severity = {
      none: this.outputData.severity.none + none,
      low: this.outputData.severity.low + low,
      medium: this.outputData.severity.medium + medium,
      high: this.outputData.severity.high + high,
      critical: this.outputData.severity.critical + critical
    };

    // Calculate & set compliance level and color from result statuses
    // Set default compliance level and color
    this.outputData.compliance.level = '0.00%';
    this.outputData.compliance.color = 'low';

    // If results exist, calculate compliance level
    if (this.outputData.statistics.totalResults > 0) {
      // Formula: compliance = Passed/(Passed + Failed + Not Reviewed + Profile Error) * 100
      const complianceLevel = formatCompliance(
        (this.outputData.statistics.passed /
          (this.outputData.statistics.totalResults -
            this.outputData.statistics.notApplicable)) *
          100
      );
      // Set compliance level
      this.outputData.compliance.level = complianceLevel.includes('NaN')
        ? '0.00%'
        : complianceLevel;
      // Determine color of compliance level
      // High compliance is green, medium is yellow, low is red
      this.outputData.compliance.color = translateCompliance(complianceLevel);
    }
  }

  // Sets attributes for each specific result
  addResultDetails(
    result: ContextualizedControl,
    resultLevels: ContextualizedControl[]
  ): ContextualizedControl & {details: IDetail[]} & {resultID: string} & {
    resultStatus: IResultStatus;
  } & {resultSeverity: IResultSeverity} & {controlTags: string[]} {
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

    // Assign attributes
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

  // Generate SVG HTML for icons for injection into export template
  iconDataToSVG(
    iconData: string,
    fill: string,
    widthPx = 24,
    heightPx = 24,
    description?: string
  ): string {
    let imgLabel;
    // Check if description is included in function call
    // If so, include description as title/aria-label
    if (description) {
      imgLabel = `title="${description}" aria-label="${description}"`;
      // Else hide aria
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

  /** Prompt HTML generation from data pulled from file during constructor initialization
  @param dependencyDir Optional path for if template dependencies are stored on server **/
  async toHTML(dependencyDir?: string): Promise<string> {
    // Pull export template + styles and create outputData object containing data to fill template with

    let template: string;
    if (dependencyDir) {
      const templateRequest = axios.get<string>(
        `${dependencyDir}template.html`
      );
      const tailwindStylesRequest = axios.get<string>(
        `${dependencyDir}style.css`
      );
      const tailwindElementsRequest = axios.get<string>(
        `${dependencyDir}tw-elements.min.js`
      );
      const responses = await axios.all([
        templateRequest,
        tailwindStylesRequest,
        tailwindElementsRequest
      ]);

      template = responses[0].data;
      this.outputData.tailwindStyles = responses[1].data;
      // Remove source map reference in TW Elements library
      this.outputData.tailwindElements = responses[2].data.replace(
        '//# sourceMappingURL=tw-elements.umd.min.js.map',
        ''
      );
    } else if (!('readFileSync' in fs)) {
      throw new Error(
        'Cannot access server files from client. Please specify path to template files within the <project-root>/public/ folder'
      );
    } else {
      template = fs
        .readFileSync(
          path.join(__dirname, './template.html'),
          'utf8'
        )
        .toString();
      require.resolve('tw-elements/dist/js/tw-elements.umd.min.js');
      this.outputData.tailwindStyles = fs
        .readFileSync(
          path.join(__dirname, './style.css'),
          'utf8'
        )
        .toString();
      this.outputData.tailwindElements = fs
        .readFileSync(
          require.resolve('tw-elements/dist/js/tw-elements.umd.min.js'),
          'utf8'
        )
        .toString()
        .replace('//# sourceMappingURL=tw-elements.umd.min.js.map', '');
    }

    // Render template and return generated HTML file
    return Mustache.render(template, this.outputData);
  }
}
