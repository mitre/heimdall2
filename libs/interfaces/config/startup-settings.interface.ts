export interface IStartupSettings {
  readonly banner: string;
  readonly enabledOAuth: string[];
  readonly OIDCName: string;
  readonly ldap: boolean;
}
