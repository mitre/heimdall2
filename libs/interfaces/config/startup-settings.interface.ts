export interface IStartupSettings {
  readonly banner: string;
  readonly enabledOAuth: string[];
  readonly oidcName: string;
  readonly ldap: boolean;
  readonly registrationEnabled: boolean;
}
