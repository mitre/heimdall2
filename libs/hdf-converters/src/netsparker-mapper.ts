import {ExecJSON} from 'inspecjs';
import * as _ from 'lodash';
import {version as HeimdallToolsVersion} from '../package.json';
import type {
  ILookupPath,
  MappedTransform,
  ParseHtmlFunc} from './base-converter';
import {
  BaseConverter,
  impactMapping,
  buildParseHtmlFunc,
  parseXml
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {OwaspNistMapping} from './mappings/OwaspNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags
} from './utils/global';

const IMPACT_MAPPING = new Map<string, number>([
  ['critical', 1],
  ['high', 0.7],
  ['medium', 0.5],
  ['low', 0.3],
  ['best_practice', 0],
  ['information', 0]
]);

const CWE_NIST_MAPPING = new CweNistMapping();
const OWASP_NIST_MAPPING = new OwaspNistMapping();
const FIRST_CHARACTER = /^./;

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
  const result = [...cwe, ...owasp];
  if (result.length > 0) {
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
    text.push(`Exploitation-skills: ${String(exploitationSkills)}`);
  }
  const extraInformation = _.get(vulnerability, 'extra-information');
  if (extraInformation) {
    text.push(
      `Extra-information: ${JSON.stringify(extraInformation).replaceAll(
        /:/g,
        '=>'
      )}`
    );
  }
  const classification = _.get(vulnerability, 'classification');
  if (classification) {
    text.push(
      `Classification: ${JSON.stringify(classification).replaceAll(/:/g, '=>')}`
    );
  }
  const impact = _.get(vulnerability, 'impact');
  if (impact) {
    text.push(`Impact: ${String(impact)}`);
  }
  const firstSeenDate = _.get(vulnerability, 'FirstSeenDate');
  if (firstSeenDate) {
    text.push(`FirstSeenDate: ${String(firstSeenDate)}`);
  }
  const lastSeenDate = _.get(vulnerability, 'LastSeenDate');
  if (lastSeenDate) {
    text.push(`LastSeenDate: ${String(lastSeenDate)}`);
  }
  const certainty = _.get(vulnerability, 'certainty');
  if (certainty) {
    text.push(`Certainty: ${String(certainty)}`);
  }
  const type = _.get(vulnerability, 'type');
  if (type) {
    text.push(`Type: ${String(type)}`);
  }
  const confirmed = _.get(vulnerability, 'confirmed');
  if (confirmed) {
    text.push(`Confirmed: ${String(confirmed)}`);
  }
  return text.join('<br>');
}
function formatCheck(
  parseHtml: ParseHtmlFunc,
  vulnerability: unknown
): string {
  const text: string[] = [];
  const exploitationSkills = _.get(vulnerability, 'exploitation-skills');
  if (exploitationSkills) {
    text.push(`Exploitation-skills: ${String(exploitationSkills)}`);
  }
  const proofOfConcept = _.get(vulnerability, 'proof-of-concept');
  if (proofOfConcept) {
    text.push(`Proof-of-concept: ${String(proofOfConcept)}`);
  }
  return parseHtml(text.join('<br>'));
}
function formatFix(vulnerability: unknown): string {
  const text: string[] = [];
  const remedialActions = _.get(vulnerability, 'remedial-actions');
  if (remedialActions) {
    text.push(`Remedial-actions: ${String(remedialActions)}`);
  }
  const remedialProcedure = _.get(vulnerability, 'remedial-procedure');
  if (remedialProcedure) {
    text.push(`Remedial-procedure: ${String(remedialProcedure)}`);
  }
  const remedyReferences = _.get(vulnerability, 'remedy-references');
  if (remedyReferences) {
    text.push(`Remedy-references: ${String(remedyReferences)}`);
  }
  return text.join('<br>');
}
function formatCodeDesc(request: unknown): string {
  const text: string[] = [
    `http-request : ${_.get(request, 'content')}`,
    `method : ${_.get(request, 'method')}`
  ];
  return text.join('\n');
}
function formatMessage(response: unknown): string {
  const text: string[] = [
    `http-response : ${_.get(response, 'content')}`,
    `duration : ${_.get(response, 'duration')}`,
    `status-code  : ${_.get(response, 'status-code')}`
  ];
  return text.join('\n');
}

export class NetsparkerResults {
  constructor(readonly netsparkerXml: string, readonly withRaw = false) {}

  async toHdf(): Promise<ExecJSON.Execution> {
    const parseHtml = await buildParseHtmlFunc();

    return new NetsparkerMapper(
      this.netsparkerXml,
      parseHtml,
      this.withRaw
    ).toHdf();
  }
}

export class NetsparkerMapper extends BaseConverter {
  withRaw: boolean;
  parseHtml: ParseHtmlFunc;

  defineMappings(
    toolname: string
  ): MappedTransform<ExecJSON.Execution & {passthrough: unknown}, ILookupPath> {
    const capitalizedToolname = toolname.replace(FIRST_CHARACTER, (firstLetter) =>
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
              return `${capitalizedToolname} Enterprise Scan ID: ${_.get(input, 'scan-id')} URL: ${_.get(
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
                  data: {
                    transformer: (vulnerability: unknown) =>
                      formatCheck(this.parseHtml, vulnerability)
                  },
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

  constructor(
    netsparkerXml: string,
    parseHtml: ParseHtmlFunc,
    withRaw = false
  ) {
    super(parseXml(netsparkerXml));
    this.parseHtml = parseHtml;
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
