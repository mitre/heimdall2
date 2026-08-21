export type SplunkConfig = {
  app?: string;
  autologin?: boolean;
  host: string;
  index: string;
  owner?: string;
  password?: string;
  port?: number;
  scheme: string;
  sessionKey?: string;
  username?: string;
  version?: string;
};
