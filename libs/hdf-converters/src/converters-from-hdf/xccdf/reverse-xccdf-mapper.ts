import { type ExecJSON } from 'inspecjs';
import { ControlResultStatus } from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import * as _ from 'lodash';
import moment from 'moment';
import Mustache from 'mustache';
import type {
  MappedXCCDFtoHDF,
  TestResultStatus,
  XCCDFSeverity,
} from '../../../types/reverseMappedXCCDF';
import { getDescription, HeimdallToolsVersion } from '../../utils/global';

const DATE_FORMAT = 'YYYY-MM-DD';
const TESTING_DATE_OVERRIDE = '1970-01-01';
const TESTING_DATETIME_OVERRIDE = '2022-05-06T21:46:47.939Z';

function arrayifyObjectDescriptions(
  descriptions?: ExecJSON.ControlDescription[] | null | Record<string, any>,
): ExecJSON.ControlDescription[] {
  if (!descriptions) {
    return [];
  }

  if (Array.isArray(descriptions)) {
    return descriptions;
  }

  return Object.entries(descriptions).map(([key, value]) => {
    return {
      data: value,
      label: key,
    };
  });
}

function getXCCDFResult(control: ExecJSON.Control): TestResultStatus {
  if (control.results.some(result => result.backtrace)) {
    return 'error';
  }
  if (control.results.some(result => !result.status)) {
    return 'unknown';
  }

  if (control.results.every(result => result.status === ControlResultStatus.Passed)) {
    return 'pass';
  }

  if (control.results.every(result => result.status === ControlResultStatus.Skipped)) {
    return 'notchecked';
  }

  if (control.results.some(result => result.status === ControlResultStatus.Failed)) {
    return 'fail';
  }

  return 'unknown';
}

function getXCCDFResultMessageSeverity(segments: ExecJSON.ControlResult[]) {
  if (segments.some(result => result.backtrace)) {
    return 'medium';
  }
  return 'info';
}

function toMessageLine(segment: ExecJSON.ControlResult): string {
  switch (segment.status) {
    case ControlResultStatus.Error: {
      return `ERROR -- Test: ${segment.code_desc}\nMessage: ${segment.message}`;
    }
    case ControlResultStatus.Failed: {
      return `FAILED -- Test: ${segment.code_desc}\nMessage: ${segment.message}\n`;
    }
    case ControlResultStatus.Passed: {
      return `PASSED -- ${segment.code_desc}"`;
    }
    case ControlResultStatus.Skipped: {
      return `SKIPPED -- ${segment.skip_message}\n`;
    }
    default: {
      return `Exception: ${segment.exception}`;
    }
  }
}

function getMessages(segments: ExecJSON.ControlResult[]) {
  return segments.map(segment => toMessageLine(segment)).join('\n\n');
}

export class FromHDFToXCCDFMapper {
  data: ExecJSON.Execution;
  dateOverride: boolean;
  xccdfTemplate: string;

  constructor(data: string, xccdfTemplate: string, dateOverride = false) {
    this.data = JSON.parse(data);
    this.xccdfTemplate = xccdfTemplate;
    this.dateOverride = dateOverride;
  }

  getControlInfo(control: ExecJSON.Control) {
    const knownDescriptions = new Set([
      'cci',
      'check',
      'default',
      'documentable',
      'fix',
      'fix_id',
      'gid',
      'gtitle',
      'rid',
      'satisfies',
      'stig_id',
    ]);

    return {
      ccis: control.tags.cci || [],
      checkContent:
        getDescription(control.descriptions || [], 'check')
        || control.tags.check
        || '',
      code: control.code || '',
      description:
        control.desc
        + (control.tags.satisfies
          ? '\n\nSatisfies: ' + control.tags.satisfies.join(', ')
          : '')
        || getDescription(control.descriptions || [], 'default')
        || '',
      descriptions: arrayifyObjectDescriptions(control.descriptions).filter(
        description => !knownDescriptions.has(description.label),
      ),
      documentable: control.tags.documentable || false,
      fix:
        getDescription(control.descriptions || [], 'fix')
        || control.tags.fix
        || '',
      fixid: control.tags.fix_id,
      groupId:
        'xccdf_hdf_group_'
        + control.id
          .replaceAll('_', '-') // Prevents STIG Viewer from parsing IDs incorrectly when there is underscores after group_
          .replaceAll(/[^\w\-.]/gv, '_'), // Change everything that isn't a word, underscore, or dash into an underscore
      gtitle: control.tags.gtitle || control.title,
      id:
        'xccdf_hdf_rule_'
        + (control.tags.rid
          || control.id.replaceAll('_', '-').replaceAll(/[^\w\-.]/gv, '_') + '_rule'),
      severity: this.getSeverity(control),
      tags: Object.entries(control.tags)
        .filter(([key]) => !knownDescriptions.has(key))
        .map(([key, value]) => `${key}: ${value}`),
      title: control.title || '',
      version: control.tags.stig_id || '',
      waiver: control.waiver_data ? JSON.stringify(control.waiver_data) : '',
    };
  }

  getControlResultsInfo(control: ExecJSON.Control) {
    return {
      code: control.code || '',
      idref:
        'xccdf_hdf_rule_'
        + (control.tags.rid
          || control.id
            .replaceAll('_', '-') // Prevent STIG Viewer from parsing IDs incorrectly when there is underscores after rule_
            .replaceAll(/[^\w\-.]/gv, '_') + '_rule'),
      message: getMessages(control.results),
      messageType: getXCCDFResultMessageSeverity(control.results),
      result: getXCCDFResult(control),
    };
  }

  getExecutionTime(isoTime = false): string {
    // Extract the first results from profile level
    const results: ExecJSON.ControlResult[] = [];

    for (const profile of this.data.profiles) {
      if (profile.controls[0].results) {
        results.push(...profile.controls[0].results);
      }
    }

    // Find the execution time from the first profile level that contains it
    for (const result of results) {
      if (typeof result.start_time === 'string') {
        // Date parsing can be tricky sometimes
        try {
          const parsedDate = moment(result.start_time);
          if (parsedDate.isValid()) {
            return isoTime
              ? moment(result.start_time).toISOString()
              : moment(result.start_time, false).format(DATE_FORMAT);
          }
        } catch {
          return isoTime
            ? moment().toISOString()
            : moment().format(DATE_FORMAT);
        }
      }
    }

    // Default return date is now
    return isoTime ? moment().toISOString() : moment().format(DATE_FORMAT);
  }

  getSeverity(control: ExecJSON.Control): XCCDFSeverity {
    if (control.impact < 0.1) {
      return 'info';
    } else if (control.impact < 0.4) {
      return 'low';
    } else if (control.impact < 0.7) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  toXCCDF() {
    const passthrough = _.get(this.data, 'passthrough');
    let passthroughString = '';
    if (typeof passthrough === 'object') {
      passthroughString = JSON.stringify(passthrough);
    } else if (passthrough !== undefined) {
      passthroughString = String(passthrough);
    }

    const mappedData: MappedXCCDFtoHDF = {
      Benchmark: {
        date: this.dateOverride
          ? TESTING_DATE_OVERRIDE
          : this.getExecutionTime(),
        id: 'xccdf_mitre.hdf-converters.xccdf_benchmark_hdf2xccdf',
        metadata: {
          copyright: this.data.profiles[0].copyright || '',
          maintainer: this.data.profiles[0].maintainer || '',
        },
        passthrough: passthroughString,
        Profile: [],
        Rule: [],
        TestResult: {
          attributes: [],
          endTime: this.dateOverride
            ? TESTING_DATETIME_OVERRIDE
            : this.getExecutionTime(true),
          hasAttributes: false,
          results: [],
        },
        title: this.data.profiles[0].title || 'HDF to XCCDF Benchmark',
        version: HeimdallToolsVersion,
      },
    };

    for (const profile of this.data.profiles) {
      // Add Profile to Profile list
      mappedData.Benchmark.Profile.push({
        description: profile.description || '',
        id:
          'xccdf_mitre.hdf-converters_profile_hdf2xccdf_'
          // Replace all non-word characters and spaces with underscores
          + (profile.title?.replaceAll(/[^\w\-.]/gv, '_') || 'profile_missing_title'),
        // All control IDs
        select: profile.controls.map(
          control =>
            'xccdf_hdf_rule_'
            + (control.tags.rid
              || control.id.replaceAll('_', '-').replaceAll(/[^\w\-.]/gv, '_') + '_rule'),
        ),
        title: profile.title || '',
      });
      mappedData.Benchmark.TestResult.attributes.push(
        ...(profile.attributes || []),
      );
      if (mappedData.Benchmark.TestResult.attributes.length > 0) {
        mappedData.Benchmark.TestResult.hasAttributes = true;
      }

      for (const control of profile.controls) {
        if (control.results) {
          // Add results info
          mappedData.Benchmark.TestResult.results.push(
            this.getControlResultsInfo(control),
          );
        }
      }
    }

    // Add the control metadata for the top-level profile
    for (const control of this.data.profiles[0].controls) {
      mappedData.Benchmark.Rule.push(this.getControlInfo(control));
    }

    return Mustache.render(this.xccdfTemplate, mappedData);
  }
}
