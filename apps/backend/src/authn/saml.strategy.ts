import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from '@node-saml/passport-saml';
import { AuthnService } from './authn.service';

export class SAMLStrategy extends PassportStrategy(Strategy as any, 'saml') {}
