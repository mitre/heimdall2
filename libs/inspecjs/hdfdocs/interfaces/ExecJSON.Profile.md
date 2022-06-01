[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSON](../modules/ExecJSON.md) / Profile

# Interface: Profile

[ExecJSON](../modules/ExecJSON.md).Profile

Information on the set of controls assessed.  Example: it can include the name of the
Inspec profile and any findings.

## Table of contents

### Properties

- [attributes](ExecJSON.Profile.md#attributes)
- [controls](ExecJSON.Profile.md#controls)
- [copyright](ExecJSON.Profile.md#copyright)
- [copyright\_email](ExecJSON.Profile.md#copyright_email)
- [depends](ExecJSON.Profile.md#depends)
- [description](ExecJSON.Profile.md#description)
- [groups](ExecJSON.Profile.md#groups)
- [inspec\_version](ExecJSON.Profile.md#inspec_version)
- [license](ExecJSON.Profile.md#license)
- [maintainer](ExecJSON.Profile.md#maintainer)
- [name](ExecJSON.Profile.md#name)
- [parent\_profile](ExecJSON.Profile.md#parent_profile)
- [sha256](ExecJSON.Profile.md#sha256)
- [skip\_message](ExecJSON.Profile.md#skip_message)
- [status](ExecJSON.Profile.md#status)
- [status\_message](ExecJSON.Profile.md#status_message)
- [summary](ExecJSON.Profile.md#summary)
- [supports](ExecJSON.Profile.md#supports)
- [title](ExecJSON.Profile.md#title)
- [version](ExecJSON.Profile.md#version)

## Properties

### attributes

• **attributes**: { `[key: string]`: `any`;  }[]

The input(s) or attribute(s) used in the run.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:67](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L67)

___

### controls

• **controls**: [`Control`](ExecJSON.Control.md)[]

The set of controls including any findings.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:71](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L71)

___

### copyright

• `Optional` **copyright**: ``null`` \| `string`

The copyright holder(s).

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:75](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L75)

___

### copyright\_email

• `Optional` **copyright\_email**: ``null`` \| `string`

The email address or other contact information of the copyright holder(s).

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:79](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L79)

___

### depends

• `Optional` **depends**: ``null`` \| [`ProfileDependency`](ExecJSON.ProfileDependency.md)[]

The set of dependencies this profile depends on.  Example: an overlay profile is
dependent on another profile.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:84](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L84)

___

### description

• `Optional` **description**: ``null`` \| `string`

The description - should be more detailed than the summary.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:88](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L88)

___

### groups

• **groups**: [`ControlGroup`](ExecJSON.ControlGroup.md)[]

A set of descriptions for the control groups.  Example: the ids of the controls.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:92](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L92)

___

### inspec\_version

• `Optional` **inspec\_version**: ``null`` \| `string`

The version of Inspec.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:96](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L96)

___

### license

• `Optional` **license**: ``null`` \| `string`

The copyright license.  Example: the full text or the name, such as 'Apache License,
Version 2.0'.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:101](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L101)

___

### maintainer

• `Optional` **maintainer**: ``null`` \| `string`

The maintainer(s).

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:105](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L105)

___

### name

• **name**: `string`

The name - must be unique.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:109](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L109)

___

### parent\_profile

• `Optional` **parent\_profile**: ``null`` \| `string`

The name of the parent profile if the profile is a dependency of another.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:113](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L113)

___

### sha256

• **sha256**: `string`

The checksum of the profile.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:117](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L117)

___

### skip\_message

• `Optional` **skip\_message**: ``null`` \| `string`

The reason for skipping if it was skipped.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:121](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L121)

___

### status

• `Optional` **status**: ``null`` \| `string`

The status.  Example: loaded.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:125](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L125)

___

### status\_message

• `Optional` **status\_message**: ``null`` \| `string`

The reason for the status.  Example: why it was skipped or failed to load.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:129](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L129)

___

### summary

• `Optional` **summary**: ``null`` \| `string`

The summary.  Example: the Security Technical Implementation Guide (STIG) header.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:133](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L133)

___

### supports

• **supports**: [`SupportedPlatform`](ExecJSON.SupportedPlatform.md)[]

The set of supported platform targets.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:137](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L137)

___

### title

• `Optional` **title**: ``null`` \| `string`

The title - should be human readable.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:141](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L141)

___

### version

• `Optional` **version**: ``null`` \| `string`

The version of the profile.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:145](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L145)
