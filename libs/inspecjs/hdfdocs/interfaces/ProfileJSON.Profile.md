[inspecjs](../README.md) / [Exports](../modules.md) / [ProfileJSON](../modules/ProfileJSON.md) / Profile

# Interface: Profile

[ProfileJSON](../modules/ProfileJSON.md).Profile

Information on the set of controls that can be assessed.  Example: it can include the
name of the Inspec profile.

## Table of contents

### Properties

- [controls](ProfileJSON.Profile.md#controls)
- [copyright](ProfileJSON.Profile.md#copyright)
- [copyright\_email](ProfileJSON.Profile.md#copyright_email)
- [depends](ProfileJSON.Profile.md#depends)
- [generator](ProfileJSON.Profile.md#generator)
- [groups](ProfileJSON.Profile.md#groups)
- [inputs](ProfileJSON.Profile.md#inputs)
- [maintainer](ProfileJSON.Profile.md#maintainer)
- [name](ProfileJSON.Profile.md#name)
- [sha256](ProfileJSON.Profile.md#sha256)
- [status](ProfileJSON.Profile.md#status)
- [supports](ProfileJSON.Profile.md#supports)
- [title](ProfileJSON.Profile.md#title)
- [version](ProfileJSON.Profile.md#version)

## Properties

### controls

• **controls**: [`Control`](ProfileJSON.Control.md)[]

The set of controls - contains no findings as the assessment has not yet occurred.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:18](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L18)

___

### copyright

• `Optional` **copyright**: ``null`` \| `string`

The copyright holder(s).

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:22](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L22)

___

### copyright\_email

• `Optional` **copyright\_email**: ``null`` \| `string`

The email address or other contract information of the copyright holder(s).

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:26](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L26)

___

### depends

• `Optional` **depends**: ``null`` \| [`ProfileDependency`](ProfileJSON.ProfileDependency.md)[]

The set of dependencies this profile depends on.  Example: an overlay profile is
dependent on another profile.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:31](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L31)

___

### generator

• `Optional` **generator**: ``null`` \| `Generator`

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:32](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L32)

___

### groups

• **groups**: [`ControlGroup`](ProfileJSON.ControlGroup.md)[]

A set of descriptions for the control groups.  Example: the ids of the controls.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:36](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L36)

___

### inputs

• `Optional` **inputs**: ``null`` \| { `[key: string]`: `any`;  }[]

The input(s) or attribute(s) used to be in the run.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:40](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L40)

___

### maintainer

• `Optional` **maintainer**: ``null`` \| `string`

The maintainer(s).

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:44](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L44)

___

### name

• **name**: `string`

The name - must be unique.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:48](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L48)

___

### sha256

• **sha256**: `string`

The checksum of the profile.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:52](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L52)

___

### status

• `Optional` **status**: ``null`` \| `string`

The status.  Example: skipped.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:56](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L56)

___

### supports

• **supports**: [`SupportedPlatform`](ProfileJSON.SupportedPlatform.md)[]

The set of supported platform targets.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:60](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L60)

___

### title

• `Optional` **title**: ``null`` \| `string`

The title - should be human readable.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:64](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L64)

___

### version

• `Optional` **version**: ``null`` \| `string`

The version of the profile.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:68](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L68)
