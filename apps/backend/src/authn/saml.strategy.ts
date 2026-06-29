import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import type { Profile } from '@node-saml/passport-saml';
import { Strategy } from '@node-saml/passport-saml';
import winston from 'winston';
import { ConfigService } from '../config/config.service';
import { User } from '../users/user.model';
import { AuthnService } from './authn.service';
import { getRequiredClaim } from './resolve-claim';

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
    super({
      audience:
        configService.get('SAML_AUDIENCE')
        || configService.get('SAML_ISSUER'),
      callbackUrl: `${configService.getExternalUrl()}/authn/saml/callback`,
      entryPoint: configService.get('SAML_ENTRY_POINT') || 'disabled',
      identifierFormat: configService.get('SAML_IDENTIFIER_FORMAT'),
      idpCert: configService.get('SAML_IDP_CERT') || 'disabled',
      idpIssuer: configService.get('SAML_IDP_ISSUER'),
      issuer: configService.get('SAML_ISSUER') || 'disabled',
      privateKey: configService.get('SAML_PRIVATE_KEY'),
      publicCert: configService.get('SAML_PUBLIC_CERT'),
      decryptionPvk: configService.get('SAML_DECRYPTION_PVK'),
      wantAssertionsSigned: (configService.get('SAML_WANT_ASSERTIONS_SIGNED')??"").toLowerCase() === 'true',
      wantAuthnResponseSigned: (configService.get('SAML_WANT_AUTHN_RESPONSE_SIGNED')??"").toLowerCase() === 'true',
      signMetadata: (configService.get('SAML_SIGN_METADATA') ?? '').toLowerCase() === 'true',
      forceAuthn: (configService.get('SAML_FORCE_AUTHN') ?? '').toLowerCase() === 'true',
      passive: (configService.get('SAML_PASSIVE') ?? '').toLowerCase() === 'true',
      allowCreate: (configService.get('SAML_ALLOW_CREATE') ?? '').toLowerCase() === 'true',
      disableRequestedAuthnContext: (configService.get('SAML_DISABLE_REQUESTED_AUTHN_CONTEXT') ?? '').toLowerCase() === 'true',
      skipRequestCompression: (configService.get('SAML_SKIP_REQUEST_COMPRESSION') ?? '').toLowerCase() === 'true',
      disableRequestAcsUrl: (configService.get('SAML_DISABLE_REQUEST_ACS_URL') ?? '').toLowerCase() === 'true',
      acceptedClockSkewMs: Number(configService.get('SAML_ACCEPTED_CLOCK_SKEW_MS') ?? 0),
      maxAssertionAgeMs: Number(configService.get('SAML_MAX_ASSERTION_AGE_MS') ?? 0),
      requestIdExpirationPeriodMs: Number(configService.get('SAML_REQUEST_ID_EXPIRATION_PERIOD_MS') ?? 28800000),
      signatureAlgorithm: configService.get('SAML_SIGNATURE_ALGORITHM') as 'sha1' | 'sha256' | 'sha512' | undefined,
      digestAlgorithm: configService.get('SAML_DIGEST_ALGORITHM'),
      authnRequestBinding: configService.get('SAML_AUTHN_REQUEST_BINDING'),
      logoutUrl: configService.get('SAML_LOGOUT_URL'),
      logoutCallbackUrl: configService.get('SAML_LOGOUT_CALLBACK_URL'),
      validateInResponseTo: configService.get('SAML_VALIDATE_IN_RESPONSE_TO') as 'never' | 'ifPresent' | 'always' | undefined,
      xmlSignatureTransforms: configService.get('SAML_XML_SIGNATURE_TRANSFORMS') ? JSON.parse(configService.get('SAML_XML_SIGNATURE_TRANSFORMS') as string): undefined,
      additionalParams: configService.get('SAML_ADDITIONAL_PARAMS') ? JSON.parse(configService.get('SAML_ADDITIONAL_PARAMS') as string) : undefined,
      additionalAuthorizeParams: configService.get('SAML_ADDITIONAL_AUTHORIZE_PARAMS') ? JSON.parse(configService.get('SAML_ADDITIONAL_AUTHORIZE_PARAMS') as string) : undefined,
      additionalLogoutParams: configService.get('SAML_ADDITIONAL_LOGOUT_PARAMS') ? JSON.parse(configService.get('SAML_ADDITIONAL_LOGOUT_PARAMS') as string): undefined,
      spNameQualifier: configService.get('SAML_SP_NAME_QUALIFIER'),
      attributeConsumingServiceIndex: configService.get('SAML_ATTRIBUTE_CONSUMING_SERVICE_INDEX',),
      authnContext: configService.get('SAML_AUTHN_CONTEXT') ? configService.get('SAML_AUTHN_CONTEXT')?.split(',').map(value => value.trim()): undefined,
      racComparison: configService.get('SAML_RAC_COMPARISON') as
        | 'exact'
        | 'minimum'
        | 'maximum'
        | 'better'
        | undefined,
      providerName: configService.get('SAML_PROVIDER_NAME'),
      passReqToCallback:(configService.get('SAML_PASS_REQ_TO_CALLBACK') ?? '').toLowerCase() === 'true',
      samlAuthnRequestExtensions: configService.get('SAML_AUTHN_REQUEST_EXTENSIONS')?JSON.parse(configService.get('SAML_AUTHN_REQUEST_EXTENSIONS') as string): undefined,
      samlLogoutRequestExtensions: configService.get('SAML_LOGOUT_REQUEST_EXTENSIONS')? JSON.parse(configService.get('SAML_LOGOUT_REQUEST_EXTENSIONS') as string): undefined,
      metadataContactPerson: configService.get('SAML_METADATA_CONTACT_PERSON')? JSON.parse(configService.get('SAML_METADATA_CONTACT_PERSON') as string): undefined,
      metadataOrganization: configService.get('SAML_METADATA_ORGANIZATION')? JSON.parse(configService.get('SAML_METADATA_ORGANIZATION') as string): undefined,
      scoping: 
        configService.get('SAML_SCOPING_PROXY_COUNT')
          || configService.get('SAML_SCOPING_REQUESTER_ID')
          || configService.get('SAML_SCOPING_IDP_LIST')
        ? {
           proxyCount: configService.get('SAML_SCOPING_PROXY_COUNT')
          ? Number(configService.get('SAML_SCOPING_PROXY_COUNT'))
          : undefined,
        requesterId: configService.get('SAML_SCOPING_REQUESTER_ID')?.includes(',')
          ? configService.get('SAML_SCOPING_REQUESTER_ID')?.split(',').map(value => value.trim())
          : configService.get('SAML_SCOPING_REQUESTER_ID'),
        idpList: configService.get('SAML_SCOPING_IDP_LIST')
          ? JSON.parse(configService.get('SAML_SCOPING_IDP_LIST') as string)
          : undefined,
          }
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
