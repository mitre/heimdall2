export type SplunkConfig = {
  scheme: string;
  host: string;
  port?: number;
  username?: string;
  password?: string;
  index: string;
  owner?: string;
  app?: string;
  sessionKey?: string;
  autologin?: boolean;
  version?: string;
};
