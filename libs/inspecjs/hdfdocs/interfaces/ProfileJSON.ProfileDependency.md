[inspecjs](../README.md) / [Exports](../modules.md) / [ProfileJSON](../modules/ProfileJSON.md) / ProfileDependency

# Interface: ProfileDependency

[ProfileJSON](../modules/ProfileJSON.md).ProfileDependency

A dependency for a profile.  Can include relative paths or urls for where to find the
dependency.

## Table of contents

### Properties

- [branch](ProfileJSON.ProfileDependency.md#branch)
- [compliance](ProfileJSON.ProfileDependency.md#compliance)
- [git](ProfileJSON.ProfileDependency.md#git)
- [name](ProfileJSON.ProfileDependency.md#name)
- [path](ProfileJSON.ProfileDependency.md#path)
- [status](ProfileJSON.ProfileDependency.md#status)
- [status\_message](ProfileJSON.ProfileDependency.md#status_message)
- [supermarket](ProfileJSON.ProfileDependency.md#supermarket)
- [url](ProfileJSON.ProfileDependency.md#url)

## Properties

### branch

• `Optional` **branch**: ``null`` \| `string`

The branch name for a git repo.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:147](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L147)

___

### compliance

• `Optional` **compliance**: ``null`` \| `string`

The 'user/profilename' attribute for an Automate server.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:151](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L151)

___

### git

• `Optional` **git**: ``null`` \| `string`

The location of the git repo.  Example:
'https://github.com/mitre/canonical-ubuntu-18.04-lts-stig-baseline.git'.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:156](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L156)

___

### name

• `Optional` **name**: ``null`` \| `string`

The name/assigned alias.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:160](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L160)

___

### path

• `Optional` **path**: ``null`` \| `string`

The relative path if the dependency is locally available.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:164](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L164)

___

### status

• `Optional` **status**: ``null`` \| `string`

The status.  Should be: 'loaded', 'failed', or 'skipped'.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:168](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L168)

___

### status\_message

• `Optional` **status\_message**: ``null`` \| `string`

The reason for the status if it is 'failed' or 'skipped'.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:172](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L172)

___

### supermarket

• `Optional` **supermarket**: ``null`` \| `string`

The 'user/profilename' attribute for a Supermarket server.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:176](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L176)

___

### url

• `Optional` **url**: ``null`` \| `string`

The address of the dependency.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:180](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L180)
