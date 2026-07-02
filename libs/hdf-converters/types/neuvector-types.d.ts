export type RESTVulnerability = {
    name: string;
    score: number;
    severity: string;
    vectors: string;
    description: string;
    file_name: string;
    package_name: string;
    package_version: string;
    fixed_version: string;
    link: string;
    score_v3: number;
    vectors_v3: string;
    published_timestamp: number;
    last_modified_timestamp: number;
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
    tags?: string[];
    tags_v2?: Record<string, unknown>;
};
type RESTScanSecret = {
    type: string;
    evidence: string;
    path: string;
    suggestion: string;
};
type RESTScanSetIdPerm = {
    type: string;
    evidence: string;
    path: string;
};
type RESTScanSignatureInfo = {
    verifiers?: string[];
    verification_timestamp: string;
};
type RESTScanReport = {
    vulnerabilities: RESTVulnerability[];
    modules?: RESTScanModule[];
    checks?: RESTBenchItem[];
    secrets?: RESTScanSecret[];
    setid_perms?: RESTScanSetIdPerm[];
    envs?: string[];
    labels?: Record<string, string>;
    cmds?: string[];
    signature_data?: RESTScanSignatureInfo;
};
export type RESTScanRepoReport = {
    verdict?: string;
    image_id: string;
    registry: string;
    repository: string;
    tag: string;
    digest: string;
    size: number;
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
    size: number;
};
export type NeuVectorScanJson = {
    report: RESTScanRepoReport;
    error_message: string;
};
export {};
//# sourceMappingURL=neuvector-types.d.ts.map