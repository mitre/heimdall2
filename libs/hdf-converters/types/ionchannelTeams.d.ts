export type IonChannelTeams = {
  data: Team[];
  meta: Meta;
};

export type Team = {
  created_at: Date;
  default_deploy_key: string;
  deleted_at: Date;
  delivering: boolean;
  id: string;
  name: string;
  organization_id: string;
  poc_email: string;
  poc_name: string;
  role: string;
  status: string;
  sys_admin: boolean;
  updated_at: Date;
  user_id: string;
};

export type Meta = {
  offset: number;
  total_count: number;
};
