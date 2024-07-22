import {isFQDN, isIP, isMACAddress} from 'validator';
import {Result} from '../utils/result';
import {ChecklistMetadata, StigMetadata} from './checklist-jsonix-converter';
import {Asset, Assettype, Role, Techarea} from './checklistJsonix';
import * as Revalidator from 'revalidator';
import _ from 'lodash';

export class InvalidChecklistMetadataException extends Error {}

const assetMetadataSchema: Revalidator.JSONSchema<Asset> = {
  properties: {
    hostfqdn: {
      type: 'string',
      // STIG Viewer can autofill the FQDN as the local IP address
      conform: (fqdn: string) => !fqdn || isFQDN(fqdn) || isIP(fqdn),
      message: 'Host FQDN'
    },
    hostip: {
      type: 'string',
      conform: (ip: string) => !ip || isIP(ip),
      message: 'Host IP'
    },
    hostmac: {
      type: 'string',
      conform: (mac: string) => !mac || isMACAddress(mac),
      message: 'Host MAC'
    },
    role: {
      type: 'string',
      enum: Object.values(Role),
      message: 'Role'
    },
    assettype: {
      type: 'string',
      enum: Object.values(Assettype),
      message: 'Asset Type'
    },
    techarea: {
      type: 'string',
      enum: Object.values(Techarea),
      message: 'Tech Area'
    },
    webordatabase: {
      type: 'boolean',
      message: 'Web or Database STIG'
    }
  }
};

const profileMetadataSchema: Revalidator.JSONSchema<StigMetadata> = {
  properties: {
    version: {
      type: 'integer',
      minimum: 0,
      message: 'Version must be a non-negative integer'
    },
    releasenumber: {
      type: 'integer',
      minimum: 0,
      message: 'Release number must be a non-negative integer'
    },
    releasedate: {
      type: 'string',
      conform: (date: string) => !date || !Number.isNaN(Date.parse(date)),
      message: 'Release date must be a valid date'
    }
  }
};

export function validateChecklistAssetMetadata(
  asset: Asset
): Result<true, {invalid: string[]; message: string}> {
  const errors = Revalidator.validate(asset, assetMetadataSchema).errors;

  if (errors.length === 0) return {ok: true, value: true};
  // formats errors as: invalidField (invalidValue), otherInvalidField (otherValue), ...
  const invalidFields = errors.map(
    (e) => `${e.message} (${_.get(asset, e.property)})`
  );
  const message = `Invalid checklist metadata fields: ${invalidFields.join(', ')}`;
  return {ok: false, error: {invalid: errors.map((e) => e.property), message}};
}

export function validateChecklistProfileMetadata(
  metadata: StigMetadata
): Result<true, {invalid: string[]; message: string}> {
  const errors = Revalidator.validate(metadata, {
    ...profileMetadataSchema
  }).errors;

  if (errors.length === 0) return {ok: true, value: true};
  // formats errors as: invalidField (invalidValue), otherInvalidField (otherValue), ...
  const invalidFields = errors.map(
    (e) => `${e.message} (${_.get(metadata, e.property)})`
  );
  const message = `Invalid checklist profile metadata fields: ${invalidFields.join(', ')}`;
  return {ok: false, error: {invalid: errors.map((e) => e.property), message}};
}

export function validateChecklistMetadata(
  metadata: ChecklistMetadata
): Result<true, {invalid: string[]; message: string}> {
  let invalid: string[] = [];
  const messages: string[] = [];
  const assetResult = validateChecklistAssetMetadata({
    ...metadata,
    webordatabase: metadata.webdbinstance === 'true',
    targetkey: null
  });
  if (!assetResult.ok) {
    invalid = invalid.concat(assetResult.error.invalid);
    messages.push(assetResult.error.message);
  }

  for (const profile of metadata.profiles) {
    const profileResult = validateChecklistProfileMetadata(profile);
    if (!profileResult.ok) {
      invalid = invalid.concat(profileResult.error.invalid);
      messages.push(`Profile ${profile.name}: ${profileResult.error.message}`);
    }
  }

  if (invalid.length === 0) return {ok: true, value: true};

  const message = messages.join(', ');
  return {ok: false, error: {invalid, message}};
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
  if (!result.ok)
    throw new InvalidChecklistMetadataException(result.error.message);
}
