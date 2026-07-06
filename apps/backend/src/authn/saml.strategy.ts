import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Profile, SamlScopingConfig } from '@node-saml/passport-saml';
import { Strategy } from '@node-saml/passport-saml';
import winston from 'winston';
import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';
import { getRequiredClaim } from './resolve-claim';

function getSamlScoping(
  configService: ConfigService,
): SamlScopingConfig | undefined {
  const idpList = configService.get('SAML_SCOPING_IDP_LIST');
  const proxyCount = configService.get('SAML_SCOPING_PROXY_COUNT');
  const requesterId = configService.get('SAML_SCOPING_REQUESTER_ID');

  if (!proxyCount && !requesterId && !idpList) {
    return undefined;
  }

  return {
    idpList: idpList
      ? JSON.parse(idpList)
      : undefined,
    proxyCount: proxyCount
      ? Number(proxyCount)
      : undefined,
    requesterId: requesterId?.includes(',')
      ? requesterId.split(',').map(value => value.trim())
      : requesterId,
  };
}

@Injectable()
export class SAMLStrategy extends PassportStrategy(Strategy as any, 'saml') {
  public loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
  private readonly line = '_______________________________________________\n';
  public logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp({ format: this.loggingTimeFormat }),
      winston.format.printf(
        info =>
          `${this.line}[${[info.timestamp]}] (Authn Service): ${info.message}`,
      ),
    ),
    transports: [new winston.transports.Console()],
  });

  constructor(
    private readonly authnService: AuthnService,
    private readonly configService: ConfigService,
  ) {
    const samlAudience = configService.get('SAML_AUDIENCE');
    super({
      acceptedClockSkewMs: Number(configService.get('SAML_ACCEPTED_CLOCK_SKEW_MS') ?? 0),
      additionalAuthorizeParams: configService.get('SAML_ADDITIONAL_AUTHORIZE_PARAMS') ? JSON.parse(configService.get('SAML_ADDITIONAL_AUTHORIZE_PARAMS')!) : undefined,
      additionalLogoutParams: configService.get('SAML_ADDITIONAL_LOGOUT_PARAMS') ? JSON.parse(configService.get('SAML_ADDITIONAL_LOGOUT_PARAMS')!) : undefined,
      additionalParams: configService.get('SAML_ADDITIONAL_PARAMS') ? JSON.parse(configService.get('SAML_ADDITIONAL_PARAMS')!) : undefined,
      allowCreate: (configService.get('SAML_ALLOW_CREATE') ?? 'true').toLowerCase() === 'true',
      attributeConsumingServiceIndex: configService.get('SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX'),
      audience:
        samlAudience?.toLowerCase() === 'false'
          ? false
          : samlAudience
            || configService.get('SAML_ISSUER'),
      authnContext: configService.get('SAML_AUTHN_CONTEXT') ? configService.get('SAML_AUTHN_CONTEXT')?.split(',').map(value => value.trim()) : undefined,
      authnRequestBinding: configService.get('SAML_AUTHN_REQUEST_BINDING'),
      callbackUrl:
        configService.get('SAML_CALLBACK_URL')
        || `${configService.getExternalUrl()}/authn/saml/callback`,
      decryptionPvk: configService.get('SAML_DECRYPTION_PVK'),
      digestAlgorithm: configService.get('SAML_DIGEST_ALGORITHM'),
      disableRequestAcsUrl: (configService.get('SAML_DISABLE_REQUEST_ACS_URL') ?? '').toLowerCase() === 'true',
      disableRequestedAuthnContext: (configService.get('SAML_DISABLE_REQUESTED_AUTHN_CONTEXT') ?? '').toLowerCase() === 'true',
      entryPoint: configService.get('SAML_ENTRY_POINT') || 'disabled',
      forceAuthn: (configService.get('SAML_FORCE_AUTHN') ?? '').toLowerCase() === 'true',
      identifierFormat: configService.get('SAML_IDENTIFIER_FORMAT'),
      idpCert: configService.get('SAML_IDP_CERT') || 'disabled',
      idpIssuer: configService.get('SAML_IDP_ISSUER'),
      issuer: configService.get('SAML_ISSUER') || 'disabled',
      logoutCallbackUrl: configService.get('SAML_LOGOUT_CALLBACK_URL'),
      logoutUrl: configService.get('SAML_LOGOUT_URL'),
      maxAssertionAgeMs: Number(configService.get('SAML_MAX_ASSERTION_AGE_MS') ?? 0),
      metadataContactPerson: configService.get('SAML_METADATA_CONTACT_PERSON') ? JSON.parse(configService.get('SAML_METADATA_CONTACT_PERSON')!) : undefined,
      metadataOrganization: configService.get('SAML_METADATA_ORGANIZATION') ? JSON.parse(configService.get('SAML_METADATA_ORGANIZATION')!) : undefined,
      passive: (configService.get('SAML_PASSIVE') ?? '').toLowerCase() === 'true',
      privateKey: configService.get('SAML_PRIVATE_KEY'),
      providerName: configService.get('SAML_PROVIDER_NAME'),
      publicCert: configService.get('SAML_PUBLIC_CERT'),
      racComparison: configService.get('SAML_RAC_COMPARISON') as
      | 'better'
      | 'exact'
      | 'maximum'
      | 'minimum'
      | undefined,
      requestIdExpirationPeriodMs: Number(configService.get('SAML_REQUEST_ID_EXPIRATION_PERIOD_MS') ?? 28_800_000),
      samlAuthnRequestExtensions: configService.get('SAML_AUTHN_REQUEST_EXTENSIONS') ? JSON.parse(configService.get('SAML_AUTHN_REQUEST_EXTENSIONS')!) : undefined,
      samlLogoutRequestExtensions: configService.get('SAML_LOGOUT_REQUEST_EXTENSIONS') ? JSON.parse(configService.get('SAML_LOGOUT_REQUEST_EXTENSIONS')!) : undefined,
      scoping: getSamlScoping(configService),
      signatureAlgorithm: configService.get('SAML_SIGNATURE_ALGORITHM') as 'sha1' | 'sha256' | 'sha512' | undefined,
      signMetadata: (configService.get('SAML_SIGN_METADATA') ?? '').toLowerCase() === 'true',
      skipRequestCompression: (configService.get('SAML_SKIP_REQUEST_COMPRESSION') ?? '').toLowerCase() === 'true',
      spNameQualifier: configService.get('SAML_SP_NAME_QUALIFIER'),
      validateInResponseTo: configService.get('SAML_VALIDATE_IN_RESPONSE_TO') as 'always' | 'ifPresent' | 'never' | undefined,
      wantAssertionsSigned: (configService.get('SAML_WANT_ASSERTIONS_SIGNED') ?? 'true').toLowerCase() === 'true',
      wantAuthnResponseSigned: (configService.get('SAML_WANT_AUTHN_RESPONSE_SIGNED') ?? 'true').toLowerCase() === 'true',
      xmlSignatureTransforms: configService.get('SAML_XML_SIGNATURE_TRANSFORMS') ? JSON.parse(configService.get('SAML_XML_SIGNATURE_TRANSFORMS')!) : undefined,
    });
  }

  async validate(profile: Profile): Promise<User> {
    this.logger.debug('in saml strategy file');
    this.logger.debug(JSON.stringify(profile, null, 2));
    return this.authnService.validateOrCreateUser(
      getRequiredClaim(
        profile,
        'email',
        this.configService.get('SAML_EMAIL_ATTRIBUTE'),
      ),
      getRequiredClaim(
        profile,
        'firstName',
        this.configService.get('SAML_FIRST_NAME_ATTRIBUTE'),
      ),
      getRequiredClaim(
        profile,
        'lastName',
        this.configService.get('SAML_LAST_NAME_ATTRIBUTE'),
      ),
      'saml',
    );
  }
}
