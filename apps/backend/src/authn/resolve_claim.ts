import { UnauthorizedException } from '@nestjs/common';
import _ from 'lodash';

export function getRequiredClaim(
  claims: Record<string, unknown>,
  defaultClaimName: string,
  configuredClaimName?: string,
): string {
  const resolvedClaimName = configuredClaimName || defaultClaimName;
  const claimValue = _.get(claims, [resolvedClaimName])
    ?? _.get(claims, resolvedClaimName);
  const firstClaimValue = Array.isArray(claimValue)
    ? claimValue.find(value => typeof value === 'string' && value.length > 0)
    : claimValue;

  if (typeof firstClaimValue === 'string' && firstClaimValue.length > 0) {
    return firstClaimValue;
  }

  throw new UnauthorizedException(`Missing required claim "${resolvedClaimName}".`);
}
