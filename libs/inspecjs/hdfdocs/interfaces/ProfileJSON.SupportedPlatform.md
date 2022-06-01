[inspecjs](../README.md) / [Exports](../modules.md) / [ProfileJSON](../modules/ProfileJSON.md) / SupportedPlatform

# Interface: SupportedPlatform

[ProfileJSON](../modules/ProfileJSON.md).SupportedPlatform

A supported platform target.  Example: the platform name being 'ubuntu'.

## Table of contents

### Properties

- [os-family](ProfileJSON.SupportedPlatform.md#os-family)
- [os-name](ProfileJSON.SupportedPlatform.md#os-name)
- [platform](ProfileJSON.SupportedPlatform.md#platform)
- [platform-family](ProfileJSON.SupportedPlatform.md#platform-family)
- [platform-name](ProfileJSON.SupportedPlatform.md#platform-name)
- [release](ProfileJSON.SupportedPlatform.md#release)

## Properties

### os-family

• `Optional` **os-family**: ``null`` \| `string`

Deprecated in favor of platform-family.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:223](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L223)

___

### os-name

• `Optional` **os-name**: ``null`` \| `string`

Deprecated in favor of platform-name.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:227](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L227)

___

### platform

• `Optional` **platform**: ``null`` \| `string`

The location of the platform.  Can be: 'os', 'aws', 'azure', or 'gcp'.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:231](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L231)

___

### platform-family

• `Optional` **platform-family**: ``null`` \| `string`

The platform family.  Example: 'redhat'.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:235](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L235)

___

### platform-name

• `Optional` **platform-name**: ``null`` \| `string`

The platform name - can include wildcards.  Example: 'debian'.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:239](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L239)

___

### release

• `Optional` **release**: ``null`` \| `string`

The release of the platform.  Example: '20.04' for 'ubuntu'.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:243](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L243)
