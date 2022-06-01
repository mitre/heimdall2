[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSON](../modules/ExecJSON.md) / ProfileDependency

# Interface: ProfileDependency

[ExecJSON](../modules/ExecJSON.md).ProfileDependency

A dependency for a profile.  Can include relative paths or urls for where to find the
dependency.

## Table of contents

### Properties

- [branch](ExecJSON.ProfileDependency.md#branch)
- [compliance](ExecJSON.ProfileDependency.md#compliance)
- [git](ExecJSON.ProfileDependency.md#git)
- [name](ExecJSON.ProfileDependency.md#name)
- [path](ExecJSON.ProfileDependency.md#path)
- [status](ExecJSON.ProfileDependency.md#status)
- [status\_message](ExecJSON.ProfileDependency.md#status_message)
- [supermarket](ExecJSON.ProfileDependency.md#supermarket)
- [url](ExecJSON.ProfileDependency.md#url)

## Properties

### branch

• `Optional` **branch**: ``null`` \| `string`

The branch name for a git repo.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:320](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L320)

___

### compliance

• `Optional` **compliance**: ``null`` \| `string`

The 'user/profilename' attribute for an Automate server.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:324](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L324)

___

### git

• `Optional` **git**: ``null`` \| `string`

The location of the git repo.  Example:
'https://github.com/mitre/canonical-ubuntu-18.04-lts-stig-baseline.git'.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:329](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L329)

___

### name

• `Optional` **name**: ``null`` \| `string`

The name/assigned alias.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:333](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L333)

___

### path

• `Optional` **path**: ``null`` \| `string`

The relative path if the dependency is locally available.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:337](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L337)

___

### status

• `Optional` **status**: ``null`` \| `string`

The status.  Should be: 'loaded', 'failed', or 'skipped'.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:341](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L341)

___

### status\_message

• `Optional` **status\_message**: ``null`` \| `string`

The reason for the status if it is 'failed' or 'skipped'.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:345](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L345)

___

### supermarket

• `Optional` **supermarket**: ``null`` \| `string`

The 'user/profilename' attribute for a Supermarket server.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:349](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L349)

___

### url

• `Optional` **url**: ``null`` \| `string`

The address of the dependency.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:353](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L353)
