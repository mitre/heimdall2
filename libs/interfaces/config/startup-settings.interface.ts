export interface IStartupSettings {
  readonly apiKeysEnabled: boolean;
  readonly banner: string;
  readonly classificationBannerColor: string;
  readonly classificationBannerText: string;
  readonly classificationBannerTextColor: string;
  readonly enabledOAuth: string[];
  readonly oidcName: string;
  readonly ldap: boolean;
  readonly registrationEnabled: boolean;
  readonly localLoginEnabled: boolean;
  readonly projectMode: boolean;
}
