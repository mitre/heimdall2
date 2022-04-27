export type Projects = {
  data: Project[];
  meta: Meta;
};

export type Project = {
  id: string;
  team_id: string;
  name: string;
  active: boolean;
  draft: boolean;
  chat_channel: string;
  created_at: Date;
  updated_at: Date;
  deploy_key: string;
  should_monitor: boolean;
  monitor_frequency: string;
  poc_name: string;
  poc_email: string;
  username: string;
  password: string;
  key_fingerprint: string;
  private: boolean;
  aliases: null;
  tags: null;
  ruleset_history: null;
  sbom_id: string;
  sbom_entry_id: string;
  cpe: string;
  purl: string;
  ruleset_name: string;
  analysis_summary: AnalysisSummary;
  status: Status;
};

export type AnalysisSummary = {
  id: string;
  analysis_id: string;
  team_id: string;
  project_id: string;
  name: string;
  text: null;
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
};

export enum Status {
  Errored = 'errored',
  Failing = 'failing',
  Passing = 'passing'
}

export type Meta = {
  total_count: number;
  limit: number;
  offset: number;
};
