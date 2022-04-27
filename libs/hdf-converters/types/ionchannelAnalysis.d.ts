export type ContextualizedDependency = Dependency & {
  parentDependencies: string[];
};

export type IonChannelAnalysisResponse = {
  analysis: IonChannelAnalysis;
};

export type IonChannelAnalysis = {
  id: string;
  analysis_id: string;
  team_id: string;
  project_id: string;
  name: string;
  text: string;
  type: string;
  source: string;
  branch: string;
  description: string;
  risk: string;
  summary: string;
  passed: boolean;
  ruleset_id: string;
  ruleset_name: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  duration: number;
  trigger_hash: string;
  trigger_text: string;
  trigger_author: string;
  trigger: string;
  scan_summaries: ScanSummary[];
  public: boolean;
};

export type ScanSummary = {
  id: string;
  team_id: string;
  project_id: string;
  analysis_id: string;
  summary: string;
  results: Results;
  created_at: Date;
  updated_at: Date;
  duration: number;
  name: string;
  description: string;
};

export type Results = {
  type: string;
  data: Data;
};

export type Data = {
  vulnerabilities?: DataVulnerability[];
  meta?: Meta;
  dependencies?: Dependency[];
  CSS?: number;
  HTML?: number;
  JavaScript?: number;
  Vue?: number;
  committers?: number;
  name?: string;
  url?: string;
  committed_at?: Date;
  old_names?: string[];
  stars?: number;
  name_changed?: boolean;
  compilers?: null;
  docker_file?: DockerFile;
  known_viruses?: number;
  engine_version?: string;
  scanned_directories?: number;
  scanned_files?: number;
  infected_files?: number;
  data_scanned?: string;
  data_read?: string;
  time?: string;
  file_notes?: Record<string, unknown>;
  clam_av_details?: ClamAVDetails;
  license?: License;
  checksum?: string;
  difference?: boolean;
  message?: string;
  valid?: boolean;
  content?: string;
};

export type ClamAVDetails = {
  clamav_version: string;
  clamav_db_version: string;
};

export type Dependency = {
  latest_version: string;
  org: string;
  name: string;
  type: TypeEnum;
  package: Package;
  version: string;
  scope: Scope;
  requirement: string;
  file: File;
  outdated_version: OutdatedVersion;
  dependencies: Dependency[];
};

export enum File {
  Empty = '',
  PackageJSON = 'package.json'
}

export type OutdatedVersion = {
  major_behind: number;
  minor_behind: number;
  patch_behind: number;
};

export enum Package {
  Package = 'package'
}

export enum Scope {
  Runtime = 'runtime'
}

export enum TypeEnum {
  Npm = 'npm',
  Npmjs = 'npmjs'
}

export type DockerFile = {
  images: null;
  dependencies: null;
};

export type License = {
  name: string;
  type: TypeElement[];
};

export type TypeElement = {
  name: string;
  confidence: number;
};

export type Meta = {
  vulnerability_count?: number;
  resolved_to?: string;
  first_degree_count?: number;
  no_version_count?: number;
  total_unique_count?: number;
  update_available_count?: number;
  vulnerable_count?: number;
};

export type DataVulnerability = {
  id: number;
  external_id: string;
  source_id: number;
  title: string;
  name: string;
  org: string;
  version: string;
  up: string;
  edition: string;
  aliases: null;
  created_at: Date;
  updated_at: Date;
  references: null;
  part: string;
  language: string;
  vulnerabilities: VulnerabilityVulnerability[];
  query: Dependency;
};

export type VulnerabilityVulnerability = {
  id: number;
  external_id: string;
  source: Source[];
  title: string;
  summary: string;
  score: string;
  score_version?: string;
  score_system: string;
  score_details: ScoreDetails;
  vector: string;
  access_complexity: string;
  vulnerability_authentication: string;
  confidentiality_impact: string;
  integrity_impact: string;
  availability_impact: string;
  vulnerabilty_source: string;
  assessment_check: null;
  scanner: null;
  recommendation: string;
  references: null;
  modified_at: Date;
  published_at: Date;
  created_at: Date;
  updated_at: Date;
  mttr_seconds: null;
  dependencies: null;
};

export type ScoreDetails = {
  cvssv2?: Cvssv2;
  cvssv3?: Cvssv3;
};

export type Cvssv2 = {
  vectorString: string;
  accessVector: string;
  accessComplexity: string;
  authentication: string;
  confidentialityImpact: string;
  integrityImpact: string;
  availabilityImpact: string;
  baseScore: number;
};

export type Cvssv3 = {
  vectorString: string;
  attackVector: string;
  attackComplexity: string;
  privilegesRequired: string;
  userInteraction: string;
  scope: string;
  confidentialityImpact: string;
  integrityImpact: string;
  availabilityImpact: string;
  baseScore: number;
  baseSeverity: string;
};

export type Source = {
  id: number;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  attribution: string;
  license: string;
  copyright_url: string;
};
