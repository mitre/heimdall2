import { ExecJSON } from 'inspecjs';
import * as _ from 'lodash';
import type {
  ILookupPath,
  MappedTransform,
} from './base-converter';
import {
  BaseConverter,
  buildParseHtmlFunc,
  impactMapping,
  parseXml,
} from './base-converter';
import { CweNistMapping } from './mappings/CweNistMapping';
import { OwaspNistMapping } from './mappings/OwaspNistMapping';
import {
  DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS,
  getCCIsForNISTTags,
  HeimdallToolsVersion,
} from './utils/global';

const IMPACT_MAPPING = new Map<string, number>([
  ['best_practice', 0],
  ['critical', 1],
  ['high', 0.7],
  ['information', 0],
  ['low', 0.3],
  ['medium', 0.5],
]);

const CWE_NIST_MAPPING = new CweNistMapping();
const OWASP_NIST_MAPPING = new OwaspNistMapping();

let parseHtml: (input: unknown) => string;

export class NetsparkerMapper extends BaseConverter {
  withRaw: boolean;

  constructor(netsparkerXml: string, withRaw = false) {
    super(parseXml(netsparkerXml));
    this.withRaw = withRaw;
    this.setMappings(
      this.defineMappings(
        Object.keys(this.data).some(k => k.includes('netsparker'))
          ? 'netsparker'
          : 'invicti',
      ),
    );
  }

  defineMappings(
    toolname: string,
  ): MappedTransform<ExecJSON.Execution & { passthrough: unknown }, ILookupPath> {
    const capitalizedToolname = toolname.replace(/^./, firstLetter =>
      firstLetter.toUpperCase(),
    );
    return {
      passthrough: {
        transformer: (
          data: Record<string, unknown>,
        ): Record<string, unknown> => {
          const auxData = _.get(data, 'netsparker-enterprise');
          const genData = _.get(auxData, 'generated');
          const targetData = _.omit(_.get(auxData, 'target'), [
            'scan-id',
            'url',
            'initiated',
          ]);
          return {
            auxiliary_data: [
              {
                data: {
                  'netsparker-enterprise': {
                    generated: genData,
                    target: targetData,
                  },
                },
                name: 'Netsparker',
              },
            ],
            ...(this.withRaw && { raw: data }),
          };
        },
      },
      platform: {
        name: 'Heimdall Tools',
        release: HeimdallToolsVersion,
        target_id: { path: `${toolname}-enterprise.target.url` },
      },
      profiles: [
        {
          attributes: [],
          controls: [
            {
              code: {
                transformer: (vulnerability: Record<string, unknown>): string =>
                  JSON.stringify(vulnerability, null, 2),
              },
              desc: { transformer: formatControlDesc },
              descriptions: [
                {
                  data: { transformer: formatCheck },
                  label: 'check',
                },
                {
                  data: { transformer: formatFix },
                  label: 'fix',
                },
              ],
              id: { path: 'LookupId' },
              impact: {
                path: 'severity',
                transformer: impactMapping(IMPACT_MAPPING),
              },
              key: 'id',
              path: `${toolname}-enterprise.vulnerabilities.vulnerability`,
              refs: [],
              results: [
                {
                  code_desc: {
                    path: 'http-request',
                    transformer: formatCodeDesc,
                  },
                  message: { path: 'http-response', transformer: formatMessage },
                  start_time: { path: `$.${toolname}-enterprise.target.initiated` },
                  status: ExecJSON.ControlResultStatus.Failed,
                },
              ],
              source_location: {},
              tags: {
                cci: {
                  path: 'classification',
                  transformer: (data: Record<string, unknown>) =>
                    getCCIsForNISTTags(nistTag(data)),
                },
                nist: { path: 'classification', transformer: nistTag },
              },
              title: { path: 'name' },
            },
          ],
          groups: [],
          name: `${capitalizedToolname} Enterprise Scan`,
          sha256: '',
          status: 'loaded',
          summary: `${capitalizedToolname} Enterprise Scan`,
          supports: [],
          title: {
            path: `${toolname}-enterprise.target`,
            transformer: (input: unknown): string => {
              return `${toolname.replace(/^./, firstLetter =>
                firstLetter.toUpperCase(),
              )} Enterprise Scan ID: ${_.get(input, 'scan-id')} URL: ${_.get(
                input,
                'url',
              )}`;
            },
          },
        },
      ],
      statistics: {},
      version: HeimdallToolsVersion,
    };
  }
}
export class NetsparkerResults {
  constructor(readonly netsparkerXml: string, readonly withRaw = false) {}

  async toHdf(): Promise<ExecJSON.Execution> {
    parseHtml = await buildParseHtmlFunc();

    return (new NetsparkerMapper(this.netsparkerXml, this.withRaw)).toHdf();
  }
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
function formatCodeDesc(request: unknown): string {
  const text: string[] = [];
  text.push(`http-request : ${_.get(request, 'content')}`);
  text.push(`method : ${_.get(request, 'method')}`);
  return text.join('\n');
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
      `Extra-information: ${JSON.stringify(extraInformation).replaceAll(
        ':',
        '=>',
      )}`,
    );
  }
  const classification = _.get(vulnerability, 'classification');
  if (classification) {
    text.push(
      `Classification: ${JSON.stringify(classification).replaceAll(':', '=>')}`,
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

function formatMessage(response: unknown): string {
  const text: string[] = [];
  text.push(`http-response : ${_.get(response, 'content')}`);
  text.push(`duration : ${_.get(response, 'duration')}`);
  text.push(`status-code  : ${_.get(response, 'status-code')}`);
  return text.join('\n');
}

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
  return result.length > 0 ? result : DEFAULT_STATIC_CODE_ANALYSIS_NIST_TAGS;
}
