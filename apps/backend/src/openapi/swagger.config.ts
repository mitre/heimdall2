import {DocumentBuilder} from '@nestjs/swagger';

export function buildSwaggerConfig() {
  return new DocumentBuilder()
    .setTitle('Heimdall Enterprise Server API')
    .setDescription(
      'Security results viewer and compliance management API. ' +
        'Supports InSpec, STIG, and XCCDF result ingestion, evaluation management, ' +
        'group-based access control, and multi-provider authentication.'
    )
    .setVersion('3.0.0')
    .setContact(
      'MITRE SAF Team',
      'https://saf.mitre.org',
      'saf@mitre.org'
    )
    .setLicense('Apache-2.0', 'https://www.apache.org/licenses/LICENSE-2.0')
    .addBearerAuth({type: 'http', scheme: 'bearer'}, 'bearer')
    .addCookieAuth('heimdall.session_token', {type: 'apiKey', in: 'cookie', name: 'heimdall.session_token'}, 'cookie')
    .addApiKey({type: 'apiKey', in: 'header', name: 'x-api-key'}, 'api-key')
    .addTag('auth', 'Authentication and session management (better-auth)')
    .addTag('users', 'User management')
    .addTag('evaluations', 'Security evaluation results')
    .addTag('groups', 'Group-based access control')
    .addTag('api-keys', 'Personal access tokens')
    .addTag('statistics', 'Deployment statistics')
    .build();
}
