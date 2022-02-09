import {version as HDFConvertersVersion} from '@mitre/hdf-converters/package.json';
import {ExecJSON, Severity} from 'inspecjs';
import _ from 'lodash';
import Mustache from 'mustache';
import {Identifier, XCCDFData, XCCDFProfile} from './xccdf-types';

export type XCCDFSeverities = 'unknown' | 'info' | 'low' | 'medium' | 'high';

export function getReferences(control: ExecJSON.Control): Identifier[] {
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

export function generateRuleDescription(control: ExecJSON.Control): string {
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

export class FromHDFToXCCDFMapper {
  data: ExecJSON.Execution;
  xccdfTemplate: string;
  xccdfData: XCCDFData = {
    hdfConvertersVersion: HDFConvertersVersion,
    profiles: []
  };

  constructor(hdf: ExecJSON.Execution, xccdfTemplate: string) {
    this.data = hdf;
    this.xccdfTemplate = xccdfTemplate;
  }

  processHDF(hdf: ExecJSON.Execution): void {
    hdf.profiles.reverse().forEach((profile) => {
      // Get profile information
      const xccdfProfile: XCCDFProfile = {
        title: profile.title || 'N/A',
        description: profile.description || 'N/A',
        maintainer: profile.maintainer || 'N/A',
        source: profile.copyright_email || 'N/A',
        date: new Date().toISOString().split('T')[0],
        groups: []
      };
      profile.controls.forEach((control) => {
        const controlId = _.get(control.tags, 'rid', `${control.id}_rule`); // Splitting by underscore and checking for 'rule' is hardcoded into STIG Viewer
        const group = {
          id: control.id,
          title: _.get(control.tags, 'gtitle', control.title),
          control: {
            id: controlId,
            title: control.title || 'N/A',
            identifiers: getReferences(control),
            description: generateRuleDescription(control),
            severity: hdfSeverityToXCCDFSeverity(control.tags.severity),
            checkContent:
              control.descriptions?.find(
                (desc) => desc.label.toLowerCase() === 'check'
              )?.data || 'N/A',
            checkId: control.tags.checkid || 'N/A',
            fixContent:
              control.descriptions?.find(
                (desc) => desc.label.toLowerCase() === 'fix'
              )?.data || 'N/A',
            fixId: control.tags.fixid || 'N/A'
          }
        };
        xccdfProfile.groups.push(group);
      });
      this.xccdfData.profiles.push(xccdfProfile);
    });
  }

  toXCCDF() {
    this.processHDF(this.data);
    return Mustache.render(this.xccdfTemplate, this.xccdfData);
  }
}
