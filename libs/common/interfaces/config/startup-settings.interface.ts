import type { AuthStrategy } from './auth-strategy.interface';

export type IStartupSettings = {
  readonly apiKeysEnabled: boolean;
  readonly banner: string;
  readonly classificationBannerColor: string;
  readonly classificationBannerText: string;
  readonly classificationBannerTextColor: string;
  readonly enabledAuthStrategies: AuthStrategy[];
  readonly externalUrl: string;
  readonly forceTenableFrontend: boolean;
  readonly oidcName: string;
  readonly registrationEnabled: boolean;
  readonly splunkHostUrl: string;
  readonly tenableHostUrl: string;
};
