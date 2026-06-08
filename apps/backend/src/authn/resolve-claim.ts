import { UnauthorizedException } from '@nestjs/common';
import _ from 'lodash';

export function getRequiredClaim(
  claims: Record<string, unknown>,
  defaultClaimName: string,
  configuredClaimName?: string,
): string {
  const resolvedClaimName = configuredClaimName || defaultClaimName;
  const claimValue = _.get(claims, [resolvedClaimName]);

  if (typeof claimValue === 'string' && claimValue.length > 0) {
    return claimValue;
  }

  throw new UnauthorizedException(`Missing required claim "${resolvedClaimName}".`);
}
