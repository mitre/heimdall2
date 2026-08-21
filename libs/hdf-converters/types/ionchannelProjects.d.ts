export type Projects = {
  data: Project[];
  meta: Meta;
};

export type Project = {
  active: boolean;
  aliases: null;
  analysis_summary: AnalysisSummary;
  chat_channel: string;
  cpe: string;
  created_at: Date;
  deploy_key: string;
  draft: boolean;
  id: string;
  key_fingerprint: string;
  monitor_frequency: string;
  name: string;
  password: string;
  poc_email: string;
  poc_name: string;
  private: boolean;
  purl: string;
  ruleset_history: null;
  ruleset_name: string;
  sbom_entry_id: string;
  sbom_id: string;
  should_monitor: boolean;
  status: Status;
  tags: null;
  team_id: string;
  updated_at: Date;
  username: string;
};

export type AnalysisSummary = {
  analysis_id: string;
  branch: string;
  created_at: Date;
  description: string;
  duration: number;
  id: string;
  name: string;
  passed: boolean;
  project_id: string;
  risk: string;
  ruleset_id: string;
  ruleset_name: string;
  source: string;
  status: string;
  summary: string;
  team_id: string;
  text: null;
  trigger: string;
  trigger_author: string;
  trigger_hash: string;
  trigger_text: string;
  type: string;
  updated_at: Date;
};

export enum Status {
  Errored = 'errored',
  Failing = 'failing',
  Passing = 'passing',
}

export type Meta = {
  limit: number;
  offset: number;
  total_count: number;
};
