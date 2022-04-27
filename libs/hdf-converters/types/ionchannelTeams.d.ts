export type IonChannelTeams = {
  data: Team[];
  meta: Meta;
};

export type Team = {
  id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date;
  name: string;
  delivering: boolean;
  sys_admin: boolean;
  poc_name: string;
  poc_email: string;
  default_deploy_key: string;
  organization_id: string;
  user_id: string;
  role: string;
  status: string;
};

export type Meta = {
  total_count: number;
  offset: number;
};
