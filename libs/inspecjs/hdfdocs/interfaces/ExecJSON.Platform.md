[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSON](../modules/ExecJSON.md) / Platform

# Interface: Platform

[ExecJSON](../modules/ExecJSON.md).Platform

Information on the platform the run from the tool that generated the findings was from.
Example: the name of the operating system.

Platform information such as its name.

## Table of contents

### Properties

- [name](ExecJSON.Platform.md#name)
- [release](ExecJSON.Platform.md#release)
- [target\_id](ExecJSON.Platform.md#target_id)

## Properties

### name

• **name**: `string`

The name of the platform this was run on.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:46](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L46)

___

### release

• **release**: `string`

The version of the platform this was run on.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:50](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L50)

___

### target\_id

• `Optional` **target\_id**: ``null`` \| `string`

The id of the target.  Example: the name and version of the operating system were not
sufficient to identify the platform so a release identifier can additionally be provided
like '21H2' for the release version of MS Windows 10.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:56](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L56)
