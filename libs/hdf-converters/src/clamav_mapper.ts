import { ExecJSON } from 'inspecjs';
import { version as HeimdallToolsVersion } from '../package.json';
import type { ILookupPath, MappedTransform } from './base-converter';
import { BaseConverter } from './base-converter';
import { conditionallyProvideAttribute, DEFAULT_ANTIVIRUS_CCI_TAGS, DEFAULT_ANTIVIRUS_NIST_TAGS } from './utils/global';

type Outcome = 'error' | 'found' | 'info' | 'limit' | 'not_applicable' | 'not_reviewed' | 'ok' | 'unknown';

type Evidence = {
  line: string;
  message: string;
  outcome: Outcome;
};

type ClamAvFinding = {
  evidence: Evidence[];
  file: string;
  overallOutcome: Outcome;
};

type ClamAvReport = {
  duration?: number;
  findings: ClamAvFinding[];
  raw: string;
  summary: Record<string, string>;
};

/*
report (console text)                     ClamAvReport (one entry in ClamAvResults.data)
file.txt: OK                              {
                                            duration: 0.025,
----------- SCAN SUMMARY -----------         findings: [{
Infected files: 0                             evidence: [{
Time: 0.025 sec (0 m 0 s)                        line: 'file.txt: OK',
Start Date: 2026:11:10 04:00:00                  message: 'OK',
End Date:   2026:11:10 04:00:00                  outcome: 'ok'
                                              }],
                                              file: 'file.txt',
                                              overallOutcome: 'ok'
                                            }],
                                            raw: report,
                                            summary: {
                                              'Infected files': '0',
                                              Time: '0.025 sec (0 m 0 s)',
                                              'Start Date': '2026:11:10 04:00:00',
                                              'End Date': '2026:11:10 04:00:00'
                                            }
                                          }
*/
class ClamAvMapper extends BaseConverter<ClamAvReport> {
  private static readonly resultStatus: Record<Outcome, ExecJSON.ControlResultStatus> = {
    error: ExecJSON.ControlResultStatus.Error,
    found: ExecJSON.ControlResultStatus.Failed,
    info: ExecJSON.ControlResultStatus.Skipped,
    limit: ExecJSON.ControlResultStatus.Skipped,
    not_applicable: ExecJSON.ControlResultStatus.Skipped,
    not_reviewed: ExecJSON.ControlResultStatus.Skipped,
    ok: ExecJSON.ControlResultStatus.Passed,
    unknown: ExecJSON.ControlResultStatus.Skipped,
  };

  mappings: MappedTransform<ExecJSON.Execution & { passthrough: unknown }, ILookupPath> = {
    passthrough: {
      transformer: (data: ClamAvReport): Record<string, unknown> => ({
        clamav_summary: data.summary,
        ...conditionallyProvideAttribute('raw', data.raw, this.withRaw),
      }),
    },
    platform: { name: 'Heimdall Tools', release: HeimdallToolsVersion },
    profiles: [{
      attributes: [],
      controls: [{
        code: { transformer: (finding: ClamAvFinding): string => finding.evidence.map(item => item.line).join('\n') },
        id: { path: 'file' },
        impact: { transformer: (finding: ClamAvFinding): number => finding.overallOutcome === 'not_applicable' ? 0 : 0.5 },
        path: 'findings',
        refs: [],
        results: [{
          code_desc: '',
          start_time: { transformer: (): string => this.data.summary['Start Date'] ?? '' },
          status: { transformer: (finding: ClamAvFinding): ExecJSON.ControlResultStatus => ClamAvMapper.resultStatus[finding.overallOutcome] },
          transformer: (finding: ClamAvFinding): Partial<ExecJSON.ControlResult> => {
            const isSkipped = ClamAvMapper.resultStatus[finding.overallOutcome] === ExecJSON.ControlResultStatus.Skipped;
            const message = finding.evidence.map(item => item.message).join('\n');
            return {
              ...conditionallyProvideAttribute('message', message, !isSkipped),
              ...conditionallyProvideAttribute('skip_message', message, isSkipped),
            };
          },
        }],
        source_location: {},
        tags: {
          cci: DEFAULT_ANTIVIRUS_CCI_TAGS,
          nist: DEFAULT_ANTIVIRUS_NIST_TAGS,
        },
      }],
      groups: [],
      name: {
        transformer: (data: ClamAvReport): string => this.scanNumber === undefined
          ? 'ClamAV Scan'
          : `ClamAV Scan ${this.scanNumber}${data.summary['Start Date'] ? ` (${data.summary['Start Date']})` : ''}`,
      },
      sha256: '',
      status: 'loaded',
      supports: [],
      title: { transformer: (data: ClamAvReport): string => `ClamAV Scan${data.summary['Start Date'] ? ` (${data.summary['Start Date']})` : ''}` },
      version: { transformer: (): string | undefined => this.data.summary['Engine version'] },
    }],
    statistics: { duration: { transformer: (data: ClamAvReport): number | undefined => data.duration } },
    version: HeimdallToolsVersion,
  };

  scanNumber?: number;
  withRaw: boolean;

  constructor(data: ClamAvReport, withRaw = false, scanNumber?: number) {
    super(data);
    this.scanNumber = scanNumber;
    this.withRaw = withRaw;
    this.setMappings(this.mappings);
  }
}

export class ClamAvResults {
  // Output strings were derived from analysis of the ClamAV source: https://github.com/Cisco-Talos/clamav
  private static readonly diagnosticPrefixes = ['ERROR:', 'WARNING:', 'LibClamAV Error:', 'LibClamAV Warning:'];
  private static readonly progress = /^(?:Compiling|Loading):\s+\d.*(?:sigs|tasks)\s*$/v;
  private static readonly scanner = 'ClamAV scanner';
  private static readonly simpleOutcomes = new Set([
    'Access denied', 'Access denied.', "Can't access file", "Can't open directory.",
    'Empty file', 'No files scanned', 'No such file or directory', 'Not a regular file', 'Not supported file type',
    'OK', 'Permission denied', 'Symbolic link',
  ]);

  data: ClamAvReport[];
  withRaw: boolean;

  private isExcluded(message: string): boolean {
    return message === 'Excluded' || (message.startsWith('Excluded (') && message.endsWith(')'));
  }

  private isFileFailure(message: string): boolean {
    const detail = message.endsWith(' ERROR') ? message.slice(0, -6) : message;
    const errors = ['Access denied', 'Access denied.', "Can't open directory.", 'No such file or directory', 'Not a regular file', 'Not supported file type', 'Permission denied'];
    const actions = ['access', 'copy', 'move', 'open file', 'read', 'remove', 'stat', 'unlink', 'write'];
    return errors.includes(detail) || detail.startsWith('File path check failure:')
      || actions.some(action => detail === `Can't ${action}` || detail.startsWith(`Can't ${action} `));
  }

  private classifyMessage(message: string): Outcome {
    if (message === 'OK') {
      return 'ok';
    }
    const limitSignaturePrefix = 'Heuristics.Limits.Exceeded.';
    if (message.endsWith(' FOUND') || message.startsWith(limitSignaturePrefix)) {
      const signature = message.endsWith(' FOUND') ? message.slice(0, -6) : message;
      if (!signature.trim()) {
        return 'unknown';
      }
      return signature.startsWith(limitSignaturePrefix) ? 'limit' : 'found';
    }
    if (this.isFileFailure(message)) {
      return 'not_reviewed';
    }
    if (message.endsWith(' ERROR')) {
      return 'error';
    }
    if (message === 'Empty file' || message === 'Symbolic link' || this.isExcluded(message)) {
      return 'not_applicable';
    }
    const isRemediation = message === 'Removed.' || ["copied to '", "moved to '"].some(prefix => message.startsWith(prefix) && message.endsWith("'") && message.length > prefix.length + 1);
    return isRemediation ? 'info' : 'unknown';
  }

  private parseFileEvidence(line: string): undefined | { evidence: Evidence; file: string } {
    // Quarantine actions can annotate a symlink's resolved path. Keep that
    // evidence with the original file instead of interpreting the annotation
    // colon as a file/result delimiter.
    const realPath = line.indexOf(" (real path: '");
    const actionSeparator = line.lastIndexOf("'): ");
    if (realPath > 0 && actionSeparator > realPath) {
      const message = line.slice(actionSeparator + 4);
      return {
        evidence: { line, message: line.slice(realPath + 1), outcome: this.classifyMessage(message) },
        file: line.slice(0, realPath),
      };
    }
    for (const label of [' FileHash: ', ' FileType: ']) {
      const index = line.lastIndexOf(label);
      if (index > 0) {
        return {
          evidence: { line, message: line.slice(index + 1), outcome: 'info' },
          file: line.slice(0, index),
        };
      }
    }
    // Match fixed verdicts from the right, preserving colons in filenames.
    // Otherwise split at ': ' (not the Windows drive colon), retaining colons
    // inside signatures and error messages.
    const lastSeparator = line.lastIndexOf(': ');
    const lastMessage = line.slice(lastSeparator + 2);
    const verdict = lastMessage.endsWith(' ERROR') ? lastMessage.slice(0, -6) : lastMessage;
    const pathFailure = line.indexOf(': File path check failure:');
    const separator = pathFailure > 0
      ? pathFailure
      : (ClamAvResults.simpleOutcomes.has(verdict) || this.isExcluded(lastMessage) ? lastSeparator : line.indexOf(': '));
    if (separator <= 0) {
      return undefined;
    }
    const file = line.slice(0, separator);
    const message = line.slice(separator + 2);
    return { evidence: { line, message, outcome: this.classifyMessage(message) }, file };
  }

  private parseEvidence(line: string): undefined | { evidence: Evidence; file: string } {
    if (!line || ClamAvResults.progress.test(line) || (line.startsWith('Unloading') && line.endsWith(' tasks')) || (line.startsWith('Scanning ') && !line.includes(': '))) {
      return undefined;
    }

    // Inspect diagnostic prefixes before splitting paths: their messages can
    // themselves contain colons, filenames, or an ERROR suffix.
    const diagnostic = ClamAvResults.diagnosticPrefixes.find(prefix => line.startsWith(prefix));
    if (diagnostic) {
      const message = line.slice(diagnostic.length).trimStart();
      const isMetadataError = ['Failed to get local time for End Date.', 'Failed to get local time for Start Date.'].includes(message);
      // Library errors can name internal functions or database files; those
      // are scanner failures, not unassessed scan targets.
      const fileResult = diagnostic === 'LibClamAV Error:' || isMetadataError || message.startsWith("Can't ") || this.isFileFailure(message) ? undefined : this.parseFileEvidence(message);
      if (fileResult && (diagnostic !== 'ERROR:' || fileResult.evidence.outcome === 'not_reviewed')) {
        return { ...fileResult, evidence: { ...fileResult.evidence, line } };
      }
      let outcome: Outcome = 'unknown';
      if (isMetadataError) {
        outcome = 'not_reviewed';
      } else if (diagnostic === 'ERROR:' || diagnostic.endsWith('Error:')) {
        outcome = 'error';
      } else if (this.isFileFailure(message)) {
        outcome = 'not_reviewed';
      }
      return { evidence: { line, message: line, outcome }, file: ClamAvResults.scanner };
    }

    return this.parseFileEvidence(line)
      ?? { evidence: { line, message: line, outcome: 'unknown' }, file: ClamAvResults.scanner };
  }

  private groupFinding(file: string, evidence: Evidence[]): ClamAvFinding {
    const hasLimit = evidence.some(item => item.outcome === 'limit');
    const normalizedEvidence = evidence.map(item => hasLimit && item.message === 'Virus(es) detected ERROR'
      ? { ...item, outcome: 'info' as const }
      : item);
    // A confirmed failure/error takes precedence; incomplete scans cannot pass.
    const priority: Outcome[] = ['error', 'found', 'limit', 'not_reviewed', 'unknown', 'ok', 'not_applicable'];
    const overallOutcome = priority.find(candidate => normalizedEvidence.some(item => item.outcome === candidate)) ?? 'unknown';
    return {
      evidence: normalizedEvidence,
      file,
      overallOutcome,
    };
  }

  private prepareReport(lines: string[], summary: Record<string, string>, raw: string): ClamAvReport {
    const groups = new Map<string, Evidence[]>();
    const parsed = lines.map((line) => {
      const finding = this.parseEvidence(line.trim());
      if (finding) {
        finding.evidence.line = line;
      }
      return finding;
    }).filter(finding => finding !== undefined);
    const files = new Set(parsed.map(finding => finding.file));
    for (const finding of parsed) {
      const line = finding.evidence.line.trim();
      // A verbose progress line can itself contain a filename with ': '.
      if (line.startsWith('Scanning ') && files.has(line.slice(9))) {
        continue;
      }
      const hasUnknownDiagnostic = line.startsWith('LibClamAV ')
        && ClamAvResults.diagnosticPrefixes.every(prefix => !line.startsWith(prefix));
      if (hasUnknownDiagnostic || (finding.evidence.outcome === 'unknown' && !ClamAvResults.simpleOutcomes.has(finding.evidence.message))) {
        console.error(
          `Unrecognized ClamAV output: ${finding.evidence.line}. Please file an issue at https://github.com/mitre/heimdall2/issues requesting support for this output.`,
        );
      }
      const evidence = groups.get(finding.file) ?? [];
      evidence.push(finding.evidence);
      groups.set(finding.file, evidence);
    }

    // --no-summary and interrupted scans may omit timing. Time retains the
    // fractional seconds that Start Date and End Date do not provide.
    const [seconds, unit] = (summary.Time ?? '').split(' ', 2);
    const duration = unit === 'sec' && seconds ? Number(seconds) : undefined;
    return {
      ...conditionallyProvideAttribute('duration', duration, duration !== undefined && duration >= 0 && Number.isFinite(duration)),
      findings: Array.from(groups, ([file, evidence]) => this.groupFinding(file, evidence)),
      raw,
      summary,
    };
  }

  private parseReport(lines: string[], raw: string): ClamAvReport[] {
    const reports: { lines: string[]; summary: Record<string, string> }[] = [];
    let resultLines: string[] = [];
    let isSummary = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line === '----------- SCAN SUMMARY -----------') {
        reports.push({ lines: resultLines, summary: {} });
        resultLines = [];
        isSummary = true;
        continue;
      }
      if (!line) {
        isSummary = false;
        continue;
      }
      const scan = isSummary ? reports.at(-1) : undefined;
      if (scan) {
        const separator = line.indexOf(':');
        if (separator > 0 && ClamAvResults.diagnosticPrefixes.every(prefix => !line.startsWith(prefix))) {
          scan.summary[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
        } else {
          scan.lines.push(rawLine);
        }
        if (line.startsWith('End Date:')) {
          isSummary = false;
        }
      } else {
        resultLines.push(rawLine);
      }
    }

    if (reports.length === 0) {
      reports.push({ lines: [], summary: {} });
    }
    // Trailing diagnostics belong to the last scan, not a new execution.
    reports.at(-1)?.lines.push(...resultLines);
    return reports.map(scan => this.prepareReport(scan.lines, scan.summary, raw));
  }

  private parseReports(raw: string): ClamAvReport[] {
    // Native logs frame each invocation with a separator, including scans that
    // fail before producing a summary. Console captures use summary boundaries.
    const separator = '-'.repeat(79);
    const reports: string[][] = [[]];
    for (const rawLine of raw.split('\n')) {
      const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
      if (line.trim() === separator) {
        reports.push([]);
      } else {
        reports.at(-1)?.push(line);
      }
    }
    const scans = reports.filter(lines => lines.some(line => line.trim()));
    return (scans.length > 0 ? scans : [[]]).flatMap(lines => this.parseReport(lines, raw));
  }

  constructor(report: string, withRaw = false) {
    this.data = this.parseReports(report);
    this.withRaw = withRaw;
  }

  toHdf(): ExecJSON.Execution | ExecJSON.Execution[] {
    const executions = this.data.map((report, index) => new ClamAvMapper(report, this.withRaw, this.data.length > 1 ? index + 1 : undefined).toHdf());
    return executions.length === 1 ? executions[0] : executions;
  }
}
