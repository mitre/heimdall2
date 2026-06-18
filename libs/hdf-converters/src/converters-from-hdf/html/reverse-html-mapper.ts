import {
  mdiAlert,
  mdiAlertCircle,
  mdiCheckCircle,
  mdiCircle,
  mdiCloseCircle,
  mdiEqualBox,
  mdiMinusCircle,
} from '@mdi/js';
import type {
  ContextualizedControl,
  ContextualizedEvaluation,
  HDFControlSegment,
} from 'inspecjs';
import {
  convertFileContextual,
  isContextualizedEvaluation,
} from 'inspecjs';
import _ from 'lodash';
import Mustache from 'mustache';
import sanitize from 'sanitize-html';
import { formatCompliance, translateCompliance } from '../../utils/compliance';
import { css, html, js } from './embedded-assets';
import type {
  IDetail,
  IOutputData,
  IResultSeverity,
  IResultStatus,
} from './html-types';

type InputData = {
  data: ContextualizedEvaluation | string;
  fileID: string;
  fileName: string;
  filteredControls?: string[];
};

type ProcessedData = {
  data: ContextualizedEvaluation;
  fileID: string;
  fileName: string;
  filteredControls?: string[];
};

// All selectable export types for an HTML export
export enum FileExportTypes {
  Administrator = 'Administrator',
  Executive = 'Executive',
  Manager = 'Manager',
}

// Illegal characters which are not accepted by HTML id attribute
// Generally includes everything that is not alphanumeric or characters [-,_]
// Expand as needed
const ILLEGAL_CHARACTER_SET = [[String.raw`\.`, '___PERIOD___']];

export class FromHDFToHTMLMapper {
  // Generated injectable HTML for icons
  // NOTE: Icons colors should align with Vue colors used in general dashboard from apps/frontend/src/store/color_hack.ts
  // ARIA NOTE: Since icons are supplementary, descriptions are not required
  private iconHTMLStore = {
    // Not reviewed; yellow
    circleAlert: this.iconDataToSVG(mdiAlertCircle, 'rgb(254, 153, 0)'),
    // Passed; green
    circleCheck: this.iconDataToSVG(mdiCheckCircle, 'rgb(76, 176, 79)'),
    // Critical severity; red
    circleCritical: this.iconDataToSVG(mdiCircle, 'rgb(244, 67, 54)'),
    // Failed; red
    circleCross: this.iconDataToSVG(mdiCloseCircle, 'rgb(243, 67, 53)'),
    // High severity; deep orange
    circleHigh: this.iconDataToSVG(mdiCircle, 'rgb(255, 87, 34)'),
    // Low severity; yellow
    circleLow: this.iconDataToSVG(mdiCircle, 'rgb(255, 235, 59)'),
    // Medium severity; orange
    circleMedium: this.iconDataToSVG(mdiCircle, 'rgb(255, 152, 0)'),
    // Not applicable; blue
    circleMinus: this.iconDataToSVG(mdiMinusCircle, 'rgb(3, 169, 244)'),
    // No severity; blue
    circleNone: this.iconDataToSVG(mdiCircle, 'rgb(3, 169, 244)'),
    // Generic circle
    circleWhite: this.iconDataToSVG(mdiCircle, 'rgb(0, 0, 0)'),
    // Total count; black
    squareEqual: this.iconDataToSVG(mdiEqualBox, 'black'),
    // Profile error; purple
    triangleAlert: this.iconDataToSVG(mdiAlert, 'rgb(121, 134, 203)'),
  };

  // Default attributes
  outputData: IOutputData = {
    // Used for profile compliance reporting
    compliance: {
      color: '',
      level: '',
    },
    exportType: '',
    files: [],
    // Series of icons used for profile-related detail reports
    icons: {
      // Not reviewed
      circleAlert: this.iconHTMLStore.circleAlert,
      // Passed
      circleCheck: this.iconHTMLStore.circleCheck,
      // Critical severity
      circleCritical: this.iconHTMLStore.circleCritical,
      // Failed
      circleCross: this.iconHTMLStore.circleCross,
      // High severity
      circleHigh: this.iconHTMLStore.circleHigh,
      // Low severity
      circleLow: this.iconHTMLStore.circleLow,
      // Medium severity
      circleMedium: this.iconHTMLStore.circleMedium,
      // Not applicable
      circleMinus: this.iconHTMLStore.circleMinus,
      // No severity
      circleNone: this.iconHTMLStore.circleNone,
      // Total count
      squareEqual: this.iconHTMLStore.squareEqual,
      // Profile error
      triangleAlert: this.iconHTMLStore.triangleAlert,
    },
    resultSets: [],
    // Used for profile severity reporting
    severity: {
      critical: 0,
      high: 0,
      low: 0,
      medium: 0,
      none: 0,
    },
    showCode: false,
    showResultSets: false,
    // Used for profile status reporting
    statistics: {
      failed: 0,
      failedTests: 0,
      notApplicable: 0,
      notReviewed: 0,
      passed: 0,
      passedTests: 0,
      passingTestsFailedResult: 0,
      profileError: 0,
      totalResults: 0,
      totalTests: 0,
    },
    tailwindElements: '',
    tailwindStyles: '',
  };

  constructor(files: InputData[], exportType: FileExportTypes) {
    // Set html element visibility based on export type
    switch (exportType) {
      case FileExportTypes.Executive: {
        this.outputData.showResultSets = false;
        this.outputData.showCode = false;
        break;
      }
      case FileExportTypes.Manager: {
        this.outputData.showResultSets = true;
        this.outputData.showCode = false;
        break;
      }
      case FileExportTypes.Administrator: {
        this.outputData.showResultSets = true;
        this.outputData.showCode = true;
      }
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
          fileID: file.fileID,
          fileName: file.fileName,
          filteredControls: file.filteredControls,
        },
        exportType,
      );
    }
  }

  // Pulls and sets high level attributes of outputData object from file data
  addFiledata(file: ProcessedData, exportType: FileExportTypes) {
    // Set file profile data
    this.outputData.files.push({
      duration: _.get(
        file.data,
        'data.statistics.duration',
      ) as unknown as string,
      filename: file.fileName,
      platform: _.get(file.data, 'data.platform.name'),
      toolVersion: _.get(file.data, 'data.version'),
    });

    // Set export type
    // Controls what components are shown in HTML
    this.outputData.exportType = exportType;

    // Pull out results from file
    const filteredControlsSet = file.filteredControls ? new Set(file.filteredControls) : null;
    const allResultLevels = file.data.contains.flatMap(
      profile => profile.contains.filter(
        (result: ContextualizedControl) => !filteredControlsSet || filteredControlsSet.has(result.data.id),
      ),
    );

    // Begin filling out outpuData object to pass into HTML template
    // Set high level generalized profile details
    this.addProfileDetails(allResultLevels);

    // Set specific result details
    this.outputData.resultSets.push({
      fileID: file.fileID,
      filename: file.fileName,
      results: allResultLevels.map(result =>
        this.addResultDetails(
          result,
          allResultLevels.filter(
            searchingResult => searchingResult.data.id === result.data.id,
          ),
        ),
      ),
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
        case 'Failed': {
          failed++;
          passingTestsFailedResult += (result.root.hdf.segments || []).filter(
            (subStatus: HDFControlSegment) => subStatus.status === 'passed',
          ).length;
          failedTests += (result.root.hdf.segments || []).filter(
            (subStatus: HDFControlSegment) => subStatus.status === 'failed',
          ).length;
          break;
        }
        case 'Not Applicable': {
          notApplicable++;
          break;
        }
        case 'Not Reviewed': {
          notReviewed++;
          break;
        }
        case 'Passed': {
          passed++;
          passedTests += (result.root.hdf.segments || []).length;
          break;
        }
        case 'Profile Error': {
          profileError++;
        }
      }
      // Count out severities
      switch (result.root.hdf.severity) {
        case 'high': {
          high++;
          break;
        }
        case 'low': {
          low++;
          break;
        }
        case 'medium': {
          medium++;
          break;
        }
        case 'none': {
          none++;
          break;
        }
        case 'critical': {
          critical++;
        }
      }
    }

    // Set following attributes from existing file data
    this.outputData.statistics = {
      failed: this.outputData.statistics.failed + failed,
      failedTests: this.outputData.statistics.failedTests + failedTests,
      notApplicable: this.outputData.statistics.notApplicable + notApplicable,
      notReviewed: this.outputData.statistics.notReviewed + notReviewed,
      passed: this.outputData.statistics.passed + passed,
      passedTests: this.outputData.statistics.passedTests + passedTests,
      passingTestsFailedResult:
        this.outputData.statistics.passingTestsFailedResult
        + passingTestsFailedResult,
      profileError: this.outputData.statistics.profileError + profileError,
      totalResults: this.outputData.statistics.totalResults + results.length,
      totalTests:
        this.outputData.statistics.totalTests
        + passingTestsFailedResult
        + failedTests,
    };
    this.outputData.severity = {
      critical: this.outputData.severity.critical + critical,
      high: this.outputData.severity.high + high,
      low: this.outputData.severity.low + low,
      medium: this.outputData.severity.medium + medium,
      none: this.outputData.severity.none + none,
    };

    // Calculate & set compliance level and color from result statuses
    // Set default compliance level and color
    this.outputData.compliance.level = '0.00%';
    this.outputData.compliance.color = 'low';

    // If results exist, calculate compliance level
    if (this.outputData.statistics.totalResults > 0) {
      // Formula: compliance = Passed/(Passed + Failed + Not Reviewed + Profile Error) * 100
      const complianceLevel = formatCompliance(
        (this.outputData.statistics.passed
          / (this.outputData.statistics.totalResults
            - this.outputData.statistics.notApplicable))
          * 100,
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
    resultLevels: ContextualizedControl[],
  ): ContextualizedControl & { controlTags: string[] } & { details: IDetail[] } & { resultID: string } & { resultSeverity: IResultSeverity } & { resultStatus: IResultStatus } {
    // Check status of individual result to assign corresponding icon
    let statusColor;
    switch (result.root.hdf.status) {
      case 'Failed': {
        statusColor = this.iconHTMLStore.circleCross;
        break;
      }
      case 'Not Applicable': {
        statusColor = this.iconHTMLStore.circleMinus;
        break;
      }
      case 'Not Reviewed': {
        statusColor = this.iconHTMLStore.circleAlert;
        break;
      }
      case 'Passed': {
        statusColor = this.iconHTMLStore.circleCheck;
        break;
      }
      case 'Profile Error': {
        statusColor = this.iconHTMLStore.triangleAlert;
        break;
      }
      default: {
        statusColor = this.iconHTMLStore.circleWhite;
      }
    }

    // Severity is recorded as all lowercase by default; for aesthetic purposes, uppercase the first letter
    const severity = _.capitalize(result.root.hdf.severity);
    // Check severity of individual result to assign corresponding icon
    let severityColor;
    switch (result.root.hdf.severity) {
      case 'critical': {
        severityColor = this.iconHTMLStore.circleCritical;
        break;
      }
      case 'high': {
        severityColor = this.iconHTMLStore.circleHigh;
        break;
      }
      case 'low': {
        severityColor = this.iconHTMLStore.circleLow;
        break;
      }
      case 'medium': {
        severityColor = this.iconHTMLStore.circleMedium;
        break;
      }
      case 'none': {
        severityColor = this.iconHTMLStore.circleNone;
        break;
      }
      default: {
        severityColor = this.iconHTMLStore.circleWhite;
      }
    }

    // Grab NIST & CCI controls
    const allControls = [result.hdf.rawNistTags, result.hdf.wraps.tags.cci].filter(Boolean).flat();
    // Remove `Rev_4` item and replace `unmapped` with proper `UM-1` naming
    const filteredControls = allControls
      .map(control => (control === 'unmapped' ? 'UM-1' : control))
      .filter(control => control !== 'Rev_4');

    // Assign attributes
    return {
      ..._.set(
        result,
        'hdf.segments',
        ([] as HDFControlSegment[]).concat.apply(
          [],
          resultLevels.map(resultLevel => resultLevel.hdf.segments || []),
        ),
      ),
      controlTags: filteredControls,
      details: [
        {
          name: 'Control',
          value: result.data.id,
        },
        {
          name: 'Title',
          value: result.data.title,
        },
        {
          name: 'Caveat',
          value: result.hdf.descriptions.caveat,
        },
        {
          name: 'Desc',
          value: result.data.desc,
        },
        {
          name: 'Rationale',
          value: result.hdf.descriptions.rationale,
        },
        {
          name: 'Justification',
          value: result.hdf.descriptions.justification,
        },
        {
          name: 'Severity',
          value: result.root.hdf.severity,
        },
        {
          name: 'Impact',
          value: result.data.impact,
        },
        {
          name: 'Nist Controls',
          value: result.hdf.rawNistTags.join(', '),
        },
        {
          name: 'Check Text',
          value: result.hdf.descriptions.check || result.data.tags.check,
        },
        {
          name: 'Fix Text',
          value: result.hdf.descriptions.fix || result.data.tags.fix,
        },
      ].filter(v => v.value).map(s => ({ ...s, value: sanitize(s.value, { disallowedTagsMode: 'escape' }) })),
      full_code: result.full_code,
      resultID: this.replaceIllegalCharacters(result.hdf.wraps.id),
      resultSeverity: {
        icon: severityColor,
        severity: severity,
      },
      resultStatus: {
        icon: statusColor,
        status: result.root.hdf.status,
      },
    };
  }

  // Generate SVG HTML for icons for injection into export template
  iconDataToSVG(
    iconData: string,
    fill: string,
    widthPx = 24,
    heightPx = 24,
    description?: string,
  ): string {
    const imgLabel = description
      ? `title="${description}" aria-label="${description}"`
      : 'aria-hidden="true"';
    return `<svg style="width:${widthPx}px; height:${heightPx}px" viewBox="0 0 ${widthPx} ${heightPx}" role="img" ${imgLabel}><path fill="${fill}" d="${iconData}"/></svg>`;
  }

  // Replace all found illegal characters in string with compliant string equivalent
  replaceIllegalCharacters(text: string): string {
    for (const illegalCharacter of ILLEGAL_CHARACTER_SET) {
      text = text.replaceAll(
        new RegExp(`${illegalCharacter[0]}`, 'g'),
        illegalCharacter[1],
      );
    }
    return text;
  }

  // Prompt HTML generation from data pulled from file during constructor initialization
  toHTML(): string {
    // Pull export template + styles and create outputData object containing data to fill template with
    const template = html;
    this.outputData.tailwindStyles = css;
    // Remove source map reference in TW Elements library
    this.outputData.tailwindElements = js.replace(
      '//# sourceMappingURL=tw-elements.umd.min.js.map',
      '',
    );
    // Render template and return generated HTML file
    return Mustache.render(template, this.outputData);
  }
}
