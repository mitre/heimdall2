import axios, {AxiosResponse} from 'axios';
import {ExecJSON} from 'inspecjs';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';
import {CweNistMapping} from './mappings/CweNistMapping';
import {OwaspNistMapping} from './mappings/OwaspNistMapping';

// eslint-disable-next-line @typescript-eslint/naming-convention
export type Issue = {
  key: string;
  rule: string;
  severity: string;
  component: string;
  project: string;
  line: number;
  hash: string;
  textRange?: Record<string, unknown>;
  flows: Record<string, unknown>[];
  status: string;
  message: string;
  effort: string;
  debt: string;
  author: string;
  tags: string[];
  creationDate: Date;
  updateDate: Date;
  type: string;
  scope: string;
  snip?: string;
  summary: string;
  sysTags?: string[];
  name?: string;
};

export type IssueData = {
  total?: number;
  p?: number;
  ps?: number;
  paging?: Record<string, number>;
  effortTotal?: number;
  issues: Issue[];
  components?: Record<string, unknown>[];
  facets?: any[];
};

// Constants
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['blocker', 1.0],
  ['critical', 0.7],
  ['major', 0.5],
  ['minor', 0.3],
  ['info', 0.0]
]);
const CWE_NIST_MAPPING = new CweNistMapping();
const OWASP_NIST_MAPPING = new OwaspNistMapping();

function formatCodeDesc(vulnerability: unknown): string {
  const typedVulnerability = vulnerability as {
    component: string;
    textRange: {startLine: string; endLine: string};
    snip: string;
  };
  if (typedVulnerability.textRange) {
    const snipHtml = `StartLine: ${typedVulnerability.textRange.startLine}, EndLine: ${typedVulnerability.textRange.endLine}<br>Code:<pre>${typedVulnerability.snip}</pre>`;
    return `Path:${typedVulnerability.component}:${typedVulnerability.textRange.startLine}:${typedVulnerability.textRange.endLine} ${snipHtml}`;
  } else {
    return '';
  }
}

function parseNistTags(issue: Issue): string[] {
  const tags: string[] = [];
  issue.sysTags?.forEach((sysTag) => {
    if (sysTag.toLowerCase().startsWith('owasp-')) {
      const identifier = [
        sysTag.toLowerCase().replace('owasp-', '').toUpperCase()
      ];
      tags.push(...OWASP_NIST_MAPPING.nistFilterNoDefault(identifier));
    }
  });
  // CWE IDs are embedded inside of the HTML summary
  issue.summary.match(/CWE-\d\d\d?\d?\d?\d?\d/gi)?.forEach((match) => {
    tags.push(...CWE_NIST_MAPPING.nistFilter(match.split('-')[1]));
  });
  return tags;
}

export class SonarQubeResults {
  data: IssueData = {
    issues: []
  };
  sonarQubeHost = '';
  projectId = '';
  userToken = '';
  //TODO: add PR to SAF CLI to add flag to SQ converter 
  branchName = "";
  customMapping?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  constructor(sonarQubeHost: string, projectId: string, userToken: string, branchName?: string) {
    this.sonarQubeHost = sonarQubeHost;
    this.projectId = projectId;
    this.userToken = userToken;
    this.branchName = branchName ? branchName : "main";
  }

  async toHdf(): Promise<ExecJSON.Execution> {
    return this.getProjectData();
  }

  async getProjectData(): Promise<ExecJSON.Execution> {
    // Find issues for this project ID
    let paging = true;
    let page = 1;
    while (paging) {
      await axios
        .get<IssueData>(`${this.sonarQubeHost}/api/issues/search`, {
          auth: {username: this.userToken, password: ''},
          params: {
            componentKeys: this.projectId,
            types: 'VULNERABILITY',
            p: page,
            branch: this.branchName
          }
        })
        .then(({data}) => {
          if (data.issues) {
            this.data.issues.push(...data.issues);
          }
          paging = data.paging?.total === 100;
          page += 1;
        });
    }
    // Get code snippets for each issue
    let requests: Promise<AxiosResponse>[] = [];
    this.data.issues?.forEach((issue) => {
      requests.push(
        axios.get(`${this.sonarQubeHost}/api/sources/raw`, {
          auth: {username: this.userToken, password: ''},
          params: {
            key: issue.component
          }
        })
      );
    });
    // Wait for all requests
    await axios.all(requests).then(
      axios.spread((...responses) => {
        // Extract code snippets from SonarQube
        responses.forEach((response, index) => {
          this.data.issues[index].snip = response.data
            .split('\n')
            .slice(
              (this.data.issues[index].textRange?.startLine as number) - 3,
              // api doesn't care if we request lines past end of file
              (this.data.issues[index].textRange?.endLine as number) + 3
            )
            .join('\n');
        });
      })
    );
    // Get all rules
    requests = [];
    this.data.issues?.forEach((issue) => {
      requests.push(
        axios.get(`${this.sonarQubeHost}/api/rules/show`, {
          auth: {username: this.userToken, password: ''},
          params: {
            key: issue.rule
          }
        })
      );
    });
    await axios.all(requests).then(
      axios.spread((...responses) => {
        responses.forEach((response, index) => {
          this.data.issues[index].sysTags = response.data.rule.sysTags;
          this.data.issues[index].name = response.data.rule.name;
          this.data.issues[index].summary = response.data.rule.htmlDesc;
        });
      })
    );

    const result = new SonarQubeMapper(this.data, this.projectId);
    return result.toHdf();
  }

  setMappings(
    customMapping: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    this.customMapping = customMapping;
  }
}

function createSonarqubeMappings(
  projectName: string
): MappedTransform<ExecJSON.Execution, ILookupPath> {
  return {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: projectName
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'Sonarqube Scan',
        version: null,
        title: `SonarQube Scan of Project ${projectName}`,
        maintainer: null,
        summary: `SonarQube Scan of Project ${projectName}`,
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
            path: 'issues',
            key: 'id',
            desc: {path: 'summary'},
            descriptions: [],
            refs: [],
            source_location: {},
            id: {path: 'rule'},
            title: {path: 'name'},
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            code: null,
            tags: {
              nist: {transformer: parseNistTags}
            },
            results: [
              {
                status: ExecJSON.ControlResultStatus.Failed,
                code_desc: {transformer: formatCodeDesc},
                run_time: 0,
                start_time: ''
              }
            ]
          }
        ],
        sha256: ''
      }
    ]
  };
}

export class SonarQubeMapper extends BaseConverter {
  projectName = '';
  constructor(issuesJSON: IssueData, projectName: string) {
    super(issuesJSON as Record<string, any>);
    this.setMappings(createSonarqubeMappings(projectName));
  }

  setMappings(
    customMappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    super.setMappings(customMappings);
  }
}
