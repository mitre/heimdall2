import _ from 'lodash';
import * as Revalidator from 'revalidator';
import { isFQDN, isIP, isMACAddress } from 'validator';
import type { Result } from '../utils/result';
import type { ChecklistMetadata, StigMetadata } from './checklist-jsonix-converter';

const WHITESPACE_OR_COMMA_RE = /[\s,]+/v;
import type { Asset } from './checklistJsonix';
import { Assettype, Role, Techarea } from './checklistJsonix';

export class InvalidChecklistMetadataException extends Error {}

const assetMetadataSchema: Revalidator.JSONSchema<Asset> = {
  properties: {
    assettype: {
      enum: Object.values(Assettype),
      message: 'Asset Type',
      type: 'string',
    },
    hostfqdn: {
      // STIG Viewer can autofill the FQDN as the local IP address
      conform: (fqdn: string) => !fqdn || isFQDN(fqdn) || isIP(fqdn),
      message: 'Host FQDN',
      type: 'string',
    },
    hostip: {
      conform: (ip: string) => {
        if (!ip) {
          return true;
        } // Allow empty input
        // Split the input string by newline, space, or comma
        const ipAddresses = ip.split(WHITESPACE_OR_COMMA_RE);
        // Check each IP address using the isIP function
        return ipAddresses.every(address => isIP(address));
      },
      message:
        'Host IP addresses must be valid and separated by newline, space, or comma.',
      type: 'string',
    },
    hostmac: {
      conform: (mac: string) => {
        if (!mac) {
          return true;
        } // Allow empty input
        // Split the input string by newline, space, or comma
        const macAddresses = mac.split(WHITESPACE_OR_COMMA_RE);
        // Check each MAC address using the isMACAddress function
        return macAddresses.every(address => isMACAddress(address));
      },
      message:
        'Host MAC addresses must be valid and separated by newline, space, or comma.',
      type: 'string',
    },
    role: {
      enum: Object.values(Role),
      message: 'Role',
      type: 'string',
    },
    techarea: {
      enum: Object.values(Techarea),
      message: 'Tech Area',
      type: 'string',
    },
    webordatabase: {
      message: 'Web or Database STIG',
      type: 'boolean',
    },
  },
};

const profileMetadataSchema: Revalidator.JSONSchema<StigMetadata> = {
  properties: {
    releasedate: {
      conform: (date: string) => !date || !Number.isNaN(Date.parse(date)),
      message: 'Release date must be a valid date',
      type: 'string',
    },
    releasenumber: {
      message: 'Release number must be a non-negative integer',
      minimum: 0,
      type: 'integer',
    },
    version: {
      message: 'Version must be a non-negative integer',
      minimum: 0,
      type: 'integer',
    },
  },
};

export function validateChecklistAssetMetadata(
  asset: Asset,
): Result<true, { invalid: string[]; message: string }> {
  const errors = Revalidator.validate(asset, assetMetadataSchema).errors;

  if (errors.length === 0) {
    return { ok: true, value: true };
  }
  // formats errors as: invalidField (invalidValue), otherInvalidField (otherValue), ...
  const invalidFields = errors.map(
    e => `${e.message} (${_.get(asset, e.property)})`,
  );
  const message = `Invalid checklist metadata fields:\n\t${invalidFields.join('\n\t')}`;
  return { error: { invalid: errors.map(e => e.property), message }, ok: false };
}

export function validateChecklistProfileMetadata(
  metadata: StigMetadata,
): Result<true, { invalid: string[]; message: string }> {
  const errors = Revalidator.validate(metadata, { ...profileMetadataSchema }).errors;

  if (errors.length === 0) {
    return { ok: true, value: true };
  }
  // formats errors as: invalidField (invalidValue), otherInvalidField (otherValue), ...
  const invalidFields = errors.map(
    e => `${e.message} (${_.get(metadata, e.property)})`,
  );
  const message = `Invalid checklist profile metadata fields:\n\t${invalidFields.join('\n\t')}`;
  return { error: { invalid: errors.map(e => e.property), message }, ok: false };
}

export function validateChecklistMetadata(
  metadata: ChecklistMetadata,
): Result<true, { invalid: string[]; message: string }> {
  let invalid: string[] = [];
  const messages: string[] = [];
  const assetResult = validateChecklistAssetMetadata({
    ...metadata,
    targetkey: null,
    webordatabase: metadata.webordatabase === 'true',
  });
  if (!assetResult.ok) {
    invalid = [...invalid, ...assetResult.error.invalid];
    messages.push(assetResult.error.message);
  }

  for (const profile of metadata.profiles) {
    const profileResult = validateChecklistProfileMetadata(profile);
    if (!profileResult.ok) {
      invalid = [...invalid, ...profileResult.error.invalid];
      messages.push(
        `In profile ${profile.name}:\n${profileResult.error.message.split(':\n').at(-1)}`,
      );
    }
  }

  if (invalid.length === 0) {
    return { ok: true, value: true };
  }

  const message = messages.join('\n');
  return { error: { invalid, message }, ok: false };
}

export function throwIfInvalidProfileMetadata(profileMetadata?: StigMetadata) {
  if (profileMetadata) {
    const results = validateChecklistProfileMetadata(profileMetadata);
    if (!results.ok) {
      throw new InvalidChecklistMetadataException(results.error.message);
    }
  }
}

export function throwIfInvalidAssetMetadata(metadata: Asset) {
  const result = validateChecklistAssetMetadata(metadata);
  if (!result.ok) {
    throw new InvalidChecklistMetadataException(result.error.message);
  }
}
