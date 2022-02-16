import {version as HDFConvertersVersion} from '@mitre/hdf-converters/package.json';
import {
  AnyControl,
  ContextualizedControl,
  ContextualizedEvaluation,
  ContextualizedProfile,
  HDFControlSegment,
  Severity
} from 'inspecjs';
import {ControlResultStatus} from 'inspecjs/src/generated_parsers/v_1_0/exec-json';
import _ from 'lodash';
import Mustache from 'mustache';
import {v4 as uuid} from 'uuid';
import {Identifier, XCCDFData, XCCDFProfile} from './xccdf-types';

export type XCCDFSeverities = 'unknown' | 'info' | 'low' | 'medium' | 'high';
export type XCCDFStatus =
  | 'pass'
  | 'fail'
  | 'unknown'
  | 'error'
  | 'not applicable'
  | 'notchecked'
  | 'notselected'
  | 'informational';

export function getReferences(control: AnyControl): Identifier[] {
  const references: Identifier[] = [];

  control.tags.cci?.forEach((cci: string) => {
    references.push({
      system: 'http://cyber.mil/cci',
      value: cci
    });
  });
  return references;
}

export function escapeXml(input?: string | null): string {
  if (input) {
    return input.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<':
          return '&lt;';
        case '>':
          return '&gt;';
        case '&':
          return '&amp;';
        case "'":
          return '&apos;';
        case '"':
          return '&quot;';
        default:
          return c;
      }
    });
  }
  return 'N/A';
}

export function hdfImpactToXCCDFSeverity(impact: number): XCCDFSeverities {
  if (impact < 0.1) {
    return 'info';
  } else if (impact < 0.4) {
    return 'low';
  } else if (impact < 0.7) {
    return 'medium';
  } else if (impact <= 1) {
    return 'high';
  } else {
    return 'unknown';
  }
}

export function hdfSeverityToXCCDFSeverity(
  severity?: Severity
): XCCDFSeverities {
  switch (severity) {
    case 'none':
      return 'info';
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';
    case 'critical':
      return 'high';
    default:
      return 'unknown';
  }
}

export function generateRuleDescription(control: AnyControl): string {
  return `<VulnDiscussion>${escapeXml(control.desc)}</VulnDiscussion>
  <FalsePositives></FalsePositives>
  <FalseNegatives></FalseNegatives>
  <Documentable>false</Documentable>
  <Mitigations></Mitigations>
  <SeverityOverrideGuidance></SeverityOverrideGuidance>
  <PotentialImpacts></PotentialImpacts>
  <ThirdPartyTools></ThirdPartyTools>
  <MitigationControl></MitigationControl>
  <Responsibility></Responsibility>
  <IAControls></IAControls>`;
}

export function extractTagOrDesc(
  tags?: {[key: string]: any} | {[key: string]: any}[] | null,
  label?: string
): string | null {
  if (tags && label) {
    return (
      (Array.isArray(tags)
        ? tags.find((desc) => desc.label === label)?.data
        : tags[label]) || null
    );
  }
  return null;
}

export function getAllSegments(
  control: ContextualizedControl,
  level = 0
): HDFControlSegment[] {
  // Sanity check, we shouldn't loop this many times
  if (level >= 500) {
    throw new Error(
      'Recursive loop detected while extracting segments for XCCDF export'
    );
  }
  const segments: HDFControlSegment[] = [];
  segments.push(...(control.hdf.segments || []));
  control.extendsFrom.forEach((source) => {
    segments.push(...getAllSegments(source, level + 1));
  });
  return segments;
}

export function getStatus(segments: HDFControlSegment[]): XCCDFStatus {
  let status: XCCDFStatus = 'fail';

  // All segments passed
  if (
    segments.every((segment) => segment.status === ControlResultStatus.Passed)
  ) {
    status = 'pass';
  }
  // Any segments errored
  if (
    segments.some((segment) => segment.status === ControlResultStatus.Error)
  ) {
    status = 'error';
  }

  // If all segments are skipped
  if (
    segments.every((segment) => segment.status === ControlResultStatus.Skipped)
  ) {
    status = 'notselected';
  }
  // If some segments skip but the rest pass
  else if (
    segments.every(
      (segment) =>
        segment.status === ControlResultStatus.Skipped ||
        segment.status === ControlResultStatus.Passed
    )
  ) {
    status = 'pass';
  }
  return status;
}

export function handleExecutionJSON(
  hdf: ContextualizedEvaluation
): XCCDFProfile {
  const xccdfProfile: XCCDFProfile = {
    title: hdf.contains[0].data.title || 'NA',
    maintainer: hdf.contains[0].data.maintainer || 'NA',
    groups: [],
    date: new Date().toISOString().split('T')[0],
    hasResults: true,
    resultId: uuid(),
    source: hdf.contains[0].data.copyright_email || 'NA',
    results: []
  };
  // Top level of ExecJSON includes overlaid data, except results
  hdf.contains[0].contains.forEach((control) => {
    const controlId = _.get(
      control.hdf.wraps.tags,
      'rid',
      `${control.data.id}_rule`
    ); // Splitting by underscore and checking for 'rule' is hardcoded into STIG Viewer
    // Get control info
    const group = {
      id: control.data.id,
      title: _.get(control.hdf.wraps.tags, 'gtitle', control.data.title),
      control: {
        id: controlId,
        title: control.data.title || 'N/A',
        identifiers: getReferences(control.data),
        description: generateRuleDescription(control.data),
        severity: extractTagOrDesc(control.hdf.wraps.descriptions, 'severity')
          ? hdfImpactToXCCDFSeverity(control.data.impact)
          : hdfSeverityToXCCDFSeverity(control.hdf.wraps.tags.severity),
        checkContent:
          extractTagOrDesc(control.hdf.wraps.descriptions, 'check') ||
          extractTagOrDesc(control.hdf.wraps.tags, 'check') ||
          'N/A',
        checkId:
          extractTagOrDesc(control.hdf.wraps.descriptions, 'checkid') ||
          extractTagOrDesc(control.hdf.wraps.descriptions, 'check_id') ||
          'N/A',
        fixContent:
          extractTagOrDesc(control.hdf.wraps.descriptions, 'fix') ||
          extractTagOrDesc(control.hdf.wraps.tags, 'fix') ||
          'N/A',
        fixId:
          extractTagOrDesc(control.hdf.wraps.tags, 'fixid') ||
          extractTagOrDesc(control.hdf.wraps.tags, 'fix_id') ||
          'N/A'
      }
    };
    xccdfProfile?.groups.push(group);
    // Get results info
    const segments = getAllSegments(control);
    if (segments.length >= 1) {
      xccdfProfile?.results.push({
        controlId: control.data.id,
        severity: extractTagOrDesc(control.hdf.wraps.descriptions, 'severity')
          ? hdfSeverityToXCCDFSeverity(control.hdf.wraps.tags.severity)
          : hdfImpactToXCCDFSeverity(control.data.impact),
        result: getStatus(segments),
        identifiers: getReferences(control.data)
      });
    }
  });
  return xccdfProfile;
}

export function handleProfileJSON(hdf: ContextualizedProfile): XCCDFProfile {
  const xccdfProfile: XCCDFProfile = {
    title: hdf.data.title || 'N/A',
    maintainer: hdf.data.maintainer || 'N/A',
    groups: [],
    date: new Date().toISOString().split('T')[0],
    hasResults: false,
    resultId: uuid(),
    source: hdf.data.copyright_email || 'N/A',
    results: []
  };
  hdf.contains.forEach((control) => {
    const controlId = _.get(
      control.data.tags,
      'rid',
      `${control.data.id}_rule`
    ); // Splitting by underscore and checking for 'rule' is hardcoded into STIG Viewer
    xccdfProfile?.groups.push({
      id: control.data.id,
      title: _.get(control.hdf.wraps.tags, 'gtitle', control.data.title),
      control: {
        id: controlId,
        title: control.data.title || 'N/A',
        identifiers: getReferences(control.data),
        description: generateRuleDescription(control.data),
        severity: hdfSeverityToXCCDFSeverity(control.hdf.wraps.tags.severity),
        checkId: control.hdf.wraps.tags.checkid || 'N/A',
        fixId: control.hdf.wraps.tags.fixid || 'N/A',
        checkContent:
          control.hdf.wraps.tags.check ||
          (control.hdf.wraps.descriptions as Record<string, string>).check ||
          'N/A',
        fixContent:
          control.hdf.wraps.tags.fix ||
          (control.hdf.wraps.descriptions as Record<string, string>).fix ||
          'N/A'
      }
    });
  });
  return xccdfProfile;
}

export class FromHDFToXCCDFMapper {
  data: ContextualizedEvaluation | ContextualizedProfile;
  xccdfTemplate: string;
  xccdfData: XCCDFData = {
    hdfConvertersVersion: HDFConvertersVersion,
    profiles: []
  };

  constructor(
    hdf: ContextualizedEvaluation | ContextualizedProfile,
    xccdfTemplate: string
  ) {
    this.data = hdf;
    this.xccdfTemplate = xccdfTemplate;
  }

  processHDF(hdf: ContextualizedProfile | ContextualizedEvaluation): void {
    // If we have a profile JSON
    if ('extendedBy' in hdf) {
      this.xccdfData.profiles.push(handleProfileJSON(hdf));
    } else {
      if (hdf.contains.length >= 1) {
        this.xccdfData.profiles.push(handleExecutionJSON(hdf));
      }
    }
  }

  toXCCDF() {
    this.processHDF(this.data);
    return Mustache.render(this.xccdfTemplate, this.xccdfData);
  }
}
