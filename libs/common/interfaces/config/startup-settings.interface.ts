export type IStartupSettings = {
  readonly apiKeysEnabled: boolean;
  readonly banner: string;
  readonly classificationBannerColor: string;
  readonly classificationBannerText: string;
  readonly classificationBannerTextColor: string;
  readonly enabledOAuth: string[];
  readonly externalUrl: string;
  readonly forceTenableFrontend: boolean;
  readonly ldap: boolean;
  readonly localLoginEnabled: boolean;
  readonly oidcName: string;
  readonly registrationEnabled: boolean;
  readonly splunkHostUrl: string;
  readonly tenableHostUrl: string;
};
