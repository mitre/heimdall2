import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import { version as HeimdallToolsVersion } from '../package.json';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import { BaseConverter } from './base-converter';

// Clamscan config returning alert, not malware detection. Not Applicable rather than Failed.
const CLAMAV_LIMIT_SIGNATURE_PREFIX = 'Heuristics.Limits.Exceeded.';

// Use a stable synthetic file name for scan or database failures not associated with input file
const CLAMAV_SCANNER_ERROR_FILE = 'ClamAV scanner';

export type ClamAvFinding = {
  file: string;
  outcome: 'ERROR' | 'FOUND' | 'OK';
  signature?: string;
};

export type ClamAvReport = {
  findings: ClamAvFinding[];
  summary: Record<string, string>;
};

export class ClamAvMapper extends BaseConverter<ClamAvReport> {
  hasRaw: boolean;
  mappings: MappedTransform<
    ExecJSON.Execution & { passthrough: unknown },
    ILookupPath
  > = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: null,
    },
    version: HeimdallToolsVersion,
    statistics: {},
    profiles: [
      {
        name: 'ClamAV Scan',
        title: 'ClamAV Scan Results',
        version: { path: 'summary.Engine version' },
        maintainer: null,
        summary: null,
        license: null,
        copyright: null,
        copyright_email: null,
        supports: [],
        attributes: [],
        depends: [],
        groups: [],
        sha256: '',
        status: 'loaded',
        controls: [
          {
            arrayTransformer: updateControls,
            code: {
              transformer: (finding: ClamAvFinding): string =>
                JSON.stringify(finding, null, 2),
            },
            desc: { transformer: descriptionForFinding },
            id: { path: 'file' },
            impact: { transformer: impactForFinding },
            key: 'id',
            path: 'findings',
            refs: [],
            results: [
              {
                code_desc: {
                  transformer: (finding: ClamAvFinding): string =>
                    `File: ${finding.file}`,
                },
                message: { transformer: messageForFinding },
                start_time: { path: 'summary.Start Date' },
                status: { transformer: statusForFinding },
              },
            ],
            source_location: {},
            tags: {
              clamav_result: { path: 'outcome' },
              clamav_signature: { path: 'signature' },
              nist: ['SI-3'],
            },
            title: { transformer: titleForFinding },
          },
        ],
      },
    ],
    passthrough: {
      transformer: (data: ClamAvReport): Record<string, unknown> => ({
        clamav_summary: data.summary,
        ...(this.hasRaw && { raw: this.report }),
      }),
    },
  };

  report: string;

  constructor(report: string, hasRaw = false) {
    super(parseClamAvReport(report), true);
    this.report = report;
    this.hasRaw = hasRaw;
    this.setMappings(this.mappings);
  }
}

// Parses .txt file for human-readable portion of a clamscan report.
export function parseClamAvReport(report: string): ClamAvReport {
  const findings: ClamAvFinding[] = [];
  const summary: Record<string, string> = {};
  let isInSummary = false;

  for (const reportLine of report.split('\n')) {
    const line = _.trimEnd(reportLine, '\r');
    if (line === '----------- SCAN SUMMARY -----------') {
      isInSummary = true;
      continue;
    }

    if (isInSummary) {
      parseSummaryLine(line, summary);
      continue;
    }

    const finding = parseFindingLine(line, findings);
    if (finding) {
      findings.push(finding);
    } else if (isGlobalScanError(line)) {
      findings.push({
        file: CLAMAV_SCANNER_ERROR_FILE,
        outcome: 'ERROR',
        signature: line.trim(),
      });
    }
  }

  return { findings, summary };
}

function descriptionForFinding(finding: ClamAvFinding): string {
  if (finding.outcome === 'OK') {
    return 'ClamAV reported this file as clean.';
  }
  if (finding.outcome === 'ERROR') {
    return `ClamAV could not complete the scan: ${finding.signature}`;
  }
  if (isLimitFinding(finding)) {
    return 'The file exceeded configured ClamAV scan limits and was not fully scanned.';
  }
  return `ClamAV detected the ${finding.signature} signature.`;
}

function impactForFinding(finding: ClamAvFinding): number {
  if (isLimitFinding(finding)) {
    return 0;
  }
  const impact = finding.outcome === 'OK' ? 0.1 : 0.7;
  return impact;
}

// Disregard "Virus(es) detected ERROR" diagnostics for files that also have a companion limit alert.
function isCompanionLimitError(
  findings: ClamAvFinding[],
  file: string,
  outcome: string,
): boolean {
  return outcome === 'Virus(es) detected ERROR'
    && findings.some(finding => finding.file === file && isLimitFinding(finding));
}

// Check for clamscan database or engine failures that are not associated with a specific input file.
function isGlobalScanError(line: string): boolean {
  return /^(?:ERROR|LibClamAV Error):\s+.+/.test(line.trim());
}
// Check for clamscan limit alerts that are not associated with a specific input file.
function isLimitFinding(finding: ClamAvFinding): boolean {
  return _.startsWith(finding.signature, CLAMAV_LIMIT_SIGNATURE_PREFIX);
}

function messageForFinding(finding: ClamAvFinding): string {
  if (finding.outcome === 'OK') {
    return 'No malware detected.';
  }
  if (finding.outcome === 'ERROR') {
    return `ClamAV scan error: ${finding.signature}`;
  }
  return finding.signature ?? '';
}

// Ignore lines outside the "file: outcome" or "file: outcome signature" formats.
function parseFindingLine(
  line: string,
  findings: ClamAvFinding[],
): ClamAvFinding | undefined {
  const separatorIndex = line.lastIndexOf(': ');
  if (separatorIndex <= 0) {
    return undefined;
  }

  const file = line.slice(0, separatorIndex);
  const outcome = line.slice(separatorIndex + 2);
  if (outcome === 'OK') {
    return { file, outcome };
  }
  if (outcome.endsWith(' FOUND')) {
    const signature = outcome.slice(0, -' FOUND'.length);
    return signature ? { file, outcome: 'FOUND', signature } : undefined;
  }
  if (outcome.startsWith(CLAMAV_LIMIT_SIGNATURE_PREFIX)) {
    return { file, outcome: 'FOUND', signature: outcome };
  }
  if (outcome.endsWith(' ERROR') && !isCompanionLimitError(findings, file, outcome)) {
    return { file, outcome: 'ERROR', signature: outcome };
  }
  return undefined;
}

function parseSummaryLine(line: string, summary: Record<string, string>): void {
  const separatorIndex = line.indexOf(':');
  if (separatorIndex === -1) {
    return;
  }

  const key = line.slice(0, separatorIndex).trim();
  if (key) {
    // key is a ClamAV summary label.
    _.set(summary, key, line.slice(separatorIndex + 1).trim());
  }
}

function statusForFinding(finding: ClamAvFinding): ExecJSON.ControlResultStatus {
  if (finding.outcome === 'OK') {
    return ExecJSON.ControlResultStatus.Passed;
  }
  if (finding.outcome === 'ERROR') {
    return ExecJSON.ControlResultStatus.Error;
  }
  return isLimitFinding(finding)
    ? ExecJSON.ControlResultStatus.Skipped
    : ExecJSON.ControlResultStatus.Failed;
}

function titleForFinding(finding: ClamAvFinding): string {
  if (finding.outcome === 'OK') {
    return `ClamAV scanned ${finding.file}`;
  }
  if (finding.outcome === 'ERROR') {
    return `ClamAV scan error for ${finding.file}`;
  }
  return `ClamAV detected ${finding.signature}`;
}

// Post-mapping processing to update control IDs for duplicate file names and to mark limit findings as skipped.
function updateControls(controls: unknown[]): unknown[] {
  const controlOccurrences = new Map<string, number>();

  _.forEach(controls as ExecJSON.Control[], (control) => {
    const occurrence = (controlOccurrences.get(control.id) ?? 0) + 1;
    controlOccurrences.set(control.id, occurrence);
    if (occurrence > 1) {
      control.id = `${control.id}-${occurrence}`;
    }

    const signature = _.get(control, 'tags.clamav_signature');
    if (
      typeof signature !== 'string'
      || !signature.startsWith(CLAMAV_LIMIT_SIGNATURE_PREFIX)
    ) {
      return;
    }

    control.impact = 0;
    _.forEach(control.results, (result) => {
      result.status = ExecJSON.ControlResultStatus.Skipped;
      result.skip_message = 'Not Applicable: the file exceeded configured ClamAV scan limits; no malware detection was made.';
    });
  });
  return controls;
}
