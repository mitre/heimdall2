export interface IStartupSettings {
  readonly banner: string;
  readonly classificationLevel: string;
  readonly enabledOAuth: string[];
  readonly oidcName: string;
  readonly ldap: boolean;
  readonly registrationEnabled: boolean;
}
