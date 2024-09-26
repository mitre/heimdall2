export type RESTVulnerability = {
  // This can be a CVE, GHSA, or RHSA.
  name: string;
  // `score` is possibly CVSS v2 based on https://github.com/neuvector/scanner/blob/765fb1db2cf678ea6c6d386f3eb0f720311d745a/cvetools/cvesearch.go#L1416.
  score: number /* Tygo: float32 */;
  // Could be CVSS v3, since info for v2 and v4 doesn't always exist for CVEs.
  severity: string;
  // Could be the CVSS v2 vector.
  vectors: string;
  description: string;
  file_name: string;
  package_name: string;
  package_version: string;
  fixed_version: string;
  link: string;
  // In the NeuVector Scanning & Compliance documentation, Score (V3) is selectable by a dropdown. This could be the CVSS v3 score.
  score_v3: number /* Tygo: float32 */;
  // Could be the CVSS v3 vector.
  vectors_v3: string;
  // Both timestamp fields are Unix epoch timestamps, in seconds.
  published_timestamp: number /* Tygo: int64 */;
  last_modified_timestamp: number /* Tygo: int64 */;
  cpes?: string[];
  cves?: string[];
  feed_rating: string;
  in_base_image?: boolean;
  tags?: string[];
};

export type RESTScanModule = {
  name: string;
  file: string;
  version: string;
  source: string;
  cves?: RESTModuleCve[];
  cpes?: string[];
};

export type RESTModuleCve = {
  name: string;
  status: string;
};

type RESTBenchItem = {
  level: string;
  evidence?: string;
  location?: string;
  message: string[];
  group?: string;
} & RESTBenchCheck;

type RESTBenchCheck = {
  test_number: string;
  category: string;
  type: string;
  profile: string;
  scored: boolean;
  automated: boolean;
  description: string;
  remediation: string;
  tags?: string[]; // Tygo: Tags provide list of compliance that related to the cis test item.
  tags_v2?: Record<string, unknown /* Tygo: share.TagDetails */>; // Tygo: TagsV2 provide compliance details for each compliance tag
};

type RESTScanSecret = {
  type: string; // Tygo: the secret description
  evidence: string; // Tygo: found in a cloaked string
  path: string; // Tygo: file path
  suggestion: string; // Removed Tygo-preserved comment since it triggers a code smell
};

type RESTScanSetIdPerm = {
  type: string; // Tygo: the set id descriptions
  evidence: string; // Tygo: file attributes
  path: string; // Tygo: file path
};

type RESTScanSignatureInfo = {
  verifiers?: string[];
  verification_timestamp: string;
};

type RESTScanReport = {
  vulnerabilities: RESTVulnerability[];
  modules?: RESTScanModule[];
  // `checks` lines up with CIS benchmarks
  checks?: RESTBenchItem[];
  secrets?: RESTScanSecret[];
  setid_perms?: RESTScanSetIdPerm[];
  // Environment variables used within the Docker image
  envs?: string[];
  labels?: Record<string, string>;
  // Dockerfile CMDs
  cmds?: string[];
  signature_data?: RESTScanSignatureInfo;
};

type RESTScanRepoReport = {
  verdict?: string;
  image_id: string;
  registry: string;
  repository: string;
  tag: string;
  digest: string;

  size: number /* Tygo: int64 */;
  author: string;
  base_os: string;
  created_at: string;
  cvedb_version: string;
  cvedb_create_time: string;
  layers: RESTScanLayer[];
} & RESTScanReport;

type RESTScanLayer = {
  digest: string;
  cmds: string;
  vulnerabilities: RESTVulnerability[];
  size: number /* Tygo: int64 */;
};

export type NeuVectorScanJson = {
  report: RESTScanRepoReport;
  error_message: string;
};
