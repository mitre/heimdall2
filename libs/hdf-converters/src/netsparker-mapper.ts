import {ExecJSON} from 'inspecjs';
import _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform,
  parseHtml,
  parseXml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {OwaspNistMapping} from './mappings/OwaspNistMapping';

const IMPACT_MAPPING: Map<string, number> = new Map([
  ['critical', 1.0],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['best_practice', 0.0],
  ['information', 0.0]
]);

const CWE_NIST_MAPPING = new CweNistMapping();
const OWASP_NIST_MAPPING = new OwaspNistMapping();
const DEFAULT_NIST_TAG = ['SA-11', 'RA-5'];

function nistTag(classification: Record<string, unknown>): string[] {
  let cweTag = _.get(classification, 'cwe');
  if (!Array.isArray(cweTag)) {
    cweTag = [cweTag];
  }
  let owaspTag = _.get(classification, 'owasp');
  if (!Array.isArray(owaspTag)) {
    owaspTag = [owaspTag];
  }
  const cwe = CWE_NIST_MAPPING.nistFilter(cweTag as string[]);
  const owasp = OWASP_NIST_MAPPING.nistFilterNoDefault(owaspTag as string[]);
  const result = cwe.concat(owasp);
  if (result.length !== 0) {
    return result;
  } else {
    return DEFAULT_NIST_TAG;
  }
}
function formatControlDesc(vulnerability: unknown): string {
  const text: string[] = [];
  const description = _.get(vulnerability, 'description');
  if (description) {
    text.push(description);
  }
  const exploitationSkills = _.get(vulnerability, 'exploitation-skills');
  if (exploitationSkills) {
    text.push(`Exploitation-skills: ${exploitationSkills}`);
  }
  const extraInformation = _.get(vulnerability, 'extra-information');
  if (extraInformation) {
    text.push(
      `Extra-information: ${JSON.stringify(extraInformation).replace(
        /:/gi,
        '=>'
      )}`
    );
  }
  const classification = _.get(vulnerability, 'classification');
  if (classification) {
    text.push(
      `Classification: ${JSON.stringify(classification).replace(/:/gi, '=>')}`
    );
  }
  const impact = _.get(vulnerability, 'impact');
  if (impact) {
    text.push(`Impact: ${impact}`);
  }
  const firstSeenDate = _.get(vulnerability, 'FirstSeenDate');
  if (firstSeenDate) {
    text.push(`FirstSeenDate: ${firstSeenDate}`);
  }
  const lastSeenDate = _.get(vulnerability, 'LastSeenDate');
  if (lastSeenDate) {
    text.push(`LastSeenDate: ${lastSeenDate}`);
  }
  const certainty = _.get(vulnerability, 'certainty');
  if (certainty) {
    text.push(`Certainty: ${certainty}`);
  }
  const type = _.get(vulnerability, 'type');
  if (type) {
    text.push(`Type: ${type}`);
  }
  const confirmed = _.get(vulnerability, 'confirmed');
  if (confirmed) {
    text.push(`Confirmed: ${confirmed}`);
  }
  return text.join('<br>');
}
function formatCheck(vulnerability: unknown): string {
  const text: string[] = [];
  const exploitationSkills = _.get(vulnerability, 'exploitation-skills');
  if (exploitationSkills) {
    text.push(`Exploitation-skills: ${exploitationSkills}`);
  }
  const proofOfConcept = _.get(vulnerability, 'proof-of-concept');
  if (proofOfConcept) {
    text.push(`Proof-of-concept: ${proofOfConcept}`);
  }
  return parseHtml(text.join('<br>'));
}
function formatFix(vulnerability: unknown): string {
  const text: string[] = [];
  const remedialActions = _.get(vulnerability, 'remedial-actions');
  if (remedialActions) {
    text.push(`Remedial-actions: ${remedialActions}`);
  }
  const remedialProcedure = _.get(vulnerability, 'remedial-procedure');
  if (remedialProcedure) {
    text.push(`Remedial-procedure: ${remedialProcedure}`);
  }
  const remedyReferences = _.get(vulnerability, 'remedy-references');
  if (remedyReferences) {
    text.push(`Remedy-references: ${remedyReferences}`);
  }
  return text.join('<br>');
}
function formatCodeDesc(request: unknown): string {
  const text: string[] = [];
  text.push(`http-request : ${_.get(request, 'content')}`);
  text.push(`method : ${_.get(request, 'method')}`);
  return text.join('\n');
}
function formatMessage(response: unknown): string {
  const text: string[] = [];
  text.push(`http-response : ${_.get(response, 'content')}`);
  text.push(`duration : ${_.get(response, 'duration')}`);
  text.push(`status-code  : ${_.get(response, 'status-code')}`);
  return text.join('\n');
}
export class NetsparkerMapper extends BaseConverter {
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: {path: 'netsparker-enterprise.target.url'}
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'Netsparker Enterprise Scan',
        version: '',
        title: {
          path: 'netsparker-enterprise.target',
          transformer: (input: unknown): string => {
            return `Netsparker Enterprise Scan ID: ${_.get(
              input,
              'scan-id'
            )} URL: ${_.get(input, 'url')}`;
          }
        },
        maintainer: null,
        summary: 'Netsparker Enterprise Scan',
        license: null,
        copyright: null,
        copyright_email: null,
        supports: [],
        attributes: [],
        depends: [],
        groups: [],
        status: 'loaded',
        controls: [
          {
            path: 'netsparker-enterprise.vulnerabilities.vulnerability',
            key: 'id',
            id: {path: 'LookupId'},
            title: {path: 'name'},
            desc: {transformer: formatControlDesc},
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            tags: {
              nist: {path: 'classification', transformer: nistTag}
            },
            descriptions: [
              {
                data: {transformer: formatCheck},
                label: 'check'
              },
              {
                data: {transformer: formatFix},
                label: 'fix'
              }
            ],
            refs: [],
            source_location: {},
            code: '',
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {path: 'http-request', transformer: formatCodeDesc},
                message: {path: 'http-response', transformer: formatMessage},
                run_time: 0,
                start_time: {path: '$.netsparker-enterprise.target.initiated'}
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
  constructor(netsparkerXml: string) {
    super(parseXml(netsparkerXml), undefined, 'netsparker2hdf');
  }
  setMappings(
    customMappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    super.setMappings(customMappings);
  }
}
