import axios, {AxiosResponse} from 'axios';
import {ExecJSON} from '../../inspecjs/src';
import {version as HeimdallToolsVersion} from '../package.json';
import {
  BaseConverter,
  ILookupPath,
  impactMapping,
  MappedTransform
} from './base-converter';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Issue {
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
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface IssueData {
  total?: number;
  p?: number;
  ps?: number;
  paging?: Record<string, number>;
  effortTotal?: number;
  issues?: Issue[];
  components?: Record<string, unknown>[];
  facets?: any[];
}

// Constants
const IMPACT_MAPPING: Map<string, number> = new Map([
  ['BLOCKER', 1.0],
  ['CRITICAL', 0.7],
  ['MAJOR', 0.5],
  ['MINOR', 0.3],
  ['INFO', 0.0]
]);

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

export class SonarQubeResults {
  data: IssueData = {};
  sonarQubeHost = '';
  projectId = '';
  userToken = '';
  customMapping?: MappedTransform<ExecJSON.Execution, ILookupPath>;
  constructor(sonarQubeHost: string, projectId: string, userToken: string) {
    this.sonarQubeHost = sonarQubeHost;
    this.projectId = projectId;
    this.userToken = userToken;
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
            types: 'CODE_SMELL,BUG,VULNERABILITY',
            p: page
          }
        })
        .then(({data}) => {
          this.data.issues = data.issues;
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
    await axios.all(requests).then(
      axios.spread((...responses) => {
        responses.forEach((response, index) => {
          (this.data.issues || [])[index].snip = response.data
            .split('\n')
            .slice(
              ((this.data.issues || [])[index].textRange?.startLine as number) -
                3,
              // api doesn't care if we request lines past end of file
              ((this.data.issues || [])[index].textRange?.endLine as number) + 3
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
          (this.data.issues || [])[index].summary = response.data.rule.htmlDesc;
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

export class SonarQubeMapper extends BaseConverter {
  projectName = '';
  constructor(issuesJSON: IssueData, projectName: string) {
    super(issuesJSON as Record<string, any>);
    this.projectName = projectName;
  }
  mappings: MappedTransform<ExecJSON.Execution, ILookupPath> = {
    platform: {
      name: 'Heimdall Tools',
      release: HeimdallToolsVersion,
      target_id: this.projectName
    },
    version: HeimdallToolsVersion,
    statistics: {
      duration: null
    },
    profiles: [
      {
        name: 'Sonarqube Scan',
        version: '',
        title: `SonarQube Scan of Project ${this.projectName}`,
        maintainer: null,
        summary: `SonarQube Scan of Project ${this.projectName}`,
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
            title: {path: 'message'},
            impact: {
              path: 'severity',
              transformer: impactMapping(IMPACT_MAPPING)
            },
            tags: {},
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
  setMappings(
    customMappings: MappedTransform<ExecJSON.Execution, ILookupPath>
  ): void {
    super.setMappings(customMappings);
  }
}
