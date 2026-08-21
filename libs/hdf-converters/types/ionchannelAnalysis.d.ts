export type ContextualizedDependency = Dependency & { parentDependencies: string[] };

export type IonChannelAnalysisResponse = { analysis: IonChannelAnalysis };

export type IonChannelAnalysis = {
  analysis_id: string;
  branch: string;
  created_at: Date;
  description: string;
  duration: number;
  id: string;
  name: string;
  passed: boolean;
  project_id: string;
  public: boolean;
  risk: string;
  ruleset_id: string;
  ruleset_name: string;
  scan_summaries: ScanSummary[];
  source: string;
  status: string;
  summary: string;
  team_id: string;
  text: string;
  trigger: string;
  trigger_author: string;
  trigger_hash: string;
  trigger_text: string;
  type: string;
  updated_at: Date;
};

export type ScanSummary = {
  analysis_id: string;
  created_at: Date;
  description: string;
  duration: number;
  id: string;
  name: string;
  project_id: string;
  results: Results;
  summary: string;
  team_id: string;
  updated_at: Date;
};

export type Results = {
  data: Data;
  type: string;
};

export type Data = {
  checksum?: string;
  clam_av_details?: ClamAVDetails;
  committed_at?: Date;
  committers?: number;
  compilers?: null;
  content?: string;
  CSS?: number;
  data_read?: string;
  data_scanned?: string;
  dependencies?: Dependency[];
  difference?: boolean;
  docker_file?: DockerFile;
  engine_version?: string;
  file_notes?: Record<string, unknown>;
  HTML?: number;
  infected_files?: number;
  JavaScript?: number;
  known_viruses?: number;
  license?: License;
  message?: string;
  meta?: Meta;
  name?: string;
  name_changed?: boolean;
  old_names?: string[];
  scanned_directories?: number;
  scanned_files?: number;
  stars?: number;
  time?: string;
  url?: string;
  valid?: boolean;
  Vue?: number;
  vulnerabilities?: DataVulnerability[];
};

export type ClamAVDetails = {
  clamav_db_version: string;
  clamav_version: string;
};

export type Dependency = {
  dependencies: Dependency[];
  file: File;
  latest_version: string;
  name: string;
  org: string;
  outdated_version: OutdatedVersion;
  package: string;
  requirement: string;
  scope: Scope;
  type: string;
  version: string;
};

export enum File {
  Empty = '',
  PackageJSON = 'package.json',
}

export type OutdatedVersion = {
  major_behind: number;
  minor_behind: number;
  patch_behind: number;
};

export enum Scope { Runtime = 'runtime' }

export type DockerFile = {
  dependencies: null;
  images: null;
};

export type License = {
  name: string;
  type: TypeElement[];
};

export type TypeElement = {
  confidence: number;
  name: string;
};

export type Meta = {
  first_degree_count?: number;
  no_version_count?: number;
  resolved_to?: string;
  total_unique_count?: number;
  update_available_count?: number;
  vulnerability_count?: number;
  vulnerable_count?: number;
};

export type DataVulnerability = {
  aliases: null;
  created_at: Date;
  edition: string;
  external_id: string;
  id: number;
  language: string;
  name: string;
  org: string;
  part: string;
  query: Dependency;
  references: null;
  source_id: number;
  title: string;
  up: string;
  updated_at: Date;
  version: string;
  vulnerabilities: VulnerabilityVulnerability[];
};

export type VulnerabilityVulnerability = {
  access_complexity: string;
  assessment_check: null;
  availability_impact: string;
  confidentiality_impact: string;
  created_at: Date;
  dependencies: null;
  external_id: string;
  id: number;
  integrity_impact: string;
  modified_at: Date;
  mttr_seconds: null;
  published_at: Date;
  recommendation: string;
  references: null;
  scanner: null;
  score: string;
  score_details: ScoreDetails;
  score_system: string;
  score_version?: string;
  source: Source[];
  summary: string;
  title: string;
  updated_at: Date;
  vector: string;
  vulnerability_authentication: string;
  vulnerabilty_source: string;
};

export type ScoreDetails = {
  cvssv2?: Cvssv2;
  cvssv3?: Cvssv3;
};

export type Cvssv2 = {
  accessComplexity: string;
  accessVector: string;
  authentication: string;
  availabilityImpact: string;
  baseScore: number;
  confidentialityImpact: string;
  integrityImpact: string;
  vectorString: string;
};

export type Cvssv3 = {
  attackComplexity: string;
  attackVector: string;
  availabilityImpact: string;
  baseScore: number;
  baseSeverity: string;
  confidentialityImpact: string;
  integrityImpact: string;
  privilegesRequired: string;
  scope: string;
  userInteraction: string;
  vectorString: string;
};

export type Source = {
  attribution: string;
  copyright_url: string;
  created_at: Date;
  description: string;
  id: number;
  license: string;
  name: string;
  updated_at: Date;
};
