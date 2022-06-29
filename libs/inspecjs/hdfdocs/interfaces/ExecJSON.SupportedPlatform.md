[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSON](../modules/ExecJSON.md) / SupportedPlatform

# Interface: SupportedPlatform

[ExecJSON](../modules/ExecJSON.md).SupportedPlatform

A supported platform target.  Example: the platform name being 'ubuntu'.

## Table of contents

### Properties

- [os-family](ExecJSON.SupportedPlatform.md#os-family)
- [os-name](ExecJSON.SupportedPlatform.md#os-name)
- [platform](ExecJSON.SupportedPlatform.md#platform)
- [platform-family](ExecJSON.SupportedPlatform.md#platform-family)
- [platform-name](ExecJSON.SupportedPlatform.md#platform-name)
- [release](ExecJSON.SupportedPlatform.md#release)

## Properties

### os-family

• `Optional` **os-family**: ``null`` \| `string`

Deprecated in favor of platform-family.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:382](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L382)

___

### os-name

• `Optional` **os-name**: ``null`` \| `string`

Deprecated in favor of platform-name.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:386](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L386)

___

### platform

• `Optional` **platform**: ``null`` \| `string`

The location of the platform.  Can be: 'os', 'aws', 'azure', or 'gcp'.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:390](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L390)

___

### platform-family

• `Optional` **platform-family**: ``null`` \| `string`

The platform family.  Example: 'redhat'.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:394](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L394)

___

### platform-name

• `Optional` **platform-name**: ``null`` \| `string`

The platform name - can include wildcards.  Example: 'debian'.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:398](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L398)

___

### release

• `Optional` **release**: ``null`` \| `string`

The release of the platform.  Example: '20.04' for 'ubuntu'.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:402](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L402)
