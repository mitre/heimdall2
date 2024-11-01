import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
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
import {DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS} from './utils/global';
import {getCCIsForNISTTags} from './mappings/CciNistMapping';

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
    return DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
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
  withRaw: boolean;

  defineMappings(
    toolname: string
  ): MappedTransform<ExecJSON.Execution & {passthrough: unknown}, ILookupPath> {
    const capitalizedToolname = toolname.replace(/^./, (firstLetter) =>
      firstLetter.toUpperCase()
    );
    return {
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion,
        target_id: {path: `${toolname}-enterprise.target.url`}
      },
      version: HeimdallToolsVersion,
      statistics: {},
      profiles: [
        {
          name: `${capitalizedToolname} Enterprise Scan`,
          title: {
            path: `${toolname}-enterprise.target`,
            transformer: (input: unknown): string => {
              return `${toolname.replace(/^./, (firstLetter) =>
                firstLetter.toUpperCase()
              )} Enterprise Scan ID: ${_.get(input, 'scan-id')} URL: ${_.get(
                input,
                'url'
              )}`;
            }
          },
          summary: `${capitalizedToolname} Enterprise Scan`,
          supports: [],
          attributes: [],
          groups: [],
          status: 'loaded',
          controls: [
            {
              path: `${toolname}-enterprise.vulnerabilities.vulnerability`,
              key: 'id',
              tags: {
                cci: {
                  path: 'classification',
                  transformer: (data: Record<string, unknown>) =>
                    getCCIsForNISTTags(nistTag(data))
                },
                nist: {path: 'classification', transformer: nistTag}
              },
              refs: [],
              source_location: {},
              title: {path: 'name'},
              id: {path: 'LookupId'},
              desc: {transformer: formatControlDesc},
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
              impact: {
                path: 'severity',
                transformer: impactMapping(IMPACT_MAPPING)
              },
              code: {
                transformer: (vulnerability: Record<string, unknown>): string =>
                  JSON.stringify(vulnerability, null, 2)
              },
              results: [
                {
                  status: ExecJSON.ControlResultStatus.Failed,
                  code_desc: {
                    path: 'http-request',
                    transformer: formatCodeDesc
                  },
                  message: {path: 'http-response', transformer: formatMessage},
                  start_time: {
                    path: `$.${toolname}-enterprise.target.initiated`
                  }
                }
              ]
            }
          ],
          sha256: ''
        }
      ],
      passthrough: {
        transformer: (
          data: Record<string, unknown>
        ): Record<string, unknown> => {
          const auxData = _.get(data, 'netsparker-enterprise');
          const genData = _.get(auxData, 'generated');
          const targetData = _.omit(_.get(auxData, 'target'), [
            'scan-id',
            'url',
            'initiated'
          ]);
          return {
            auxiliary_data: [
              {
                name: 'Netsparker',
                data: {
                  'netsparker-enterprise': {
                    generated: genData,
                    target: targetData
                  }
                }
              }
            ],
            ...(this.withRaw && {raw: data})
          };
        }
      }
    };
  }
  constructor(netsparkerXml: string, withRaw = false) {
    super(parseXml(netsparkerXml));
    this.withRaw = withRaw;
    this.setMappings(
      this.defineMappings(
        Object.keys(this.data).some((k) => k.includes('netsparker'))
          ? 'netsparker'
          : 'invicti'
      )
    );
  }
}
