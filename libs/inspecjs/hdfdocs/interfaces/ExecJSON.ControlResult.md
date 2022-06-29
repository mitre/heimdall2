[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSON](../modules/ExecJSON.md) / ControlResult

# Interface: ControlResult

[ExecJSON](../modules/ExecJSON.md).ControlResult

A test within a control and its results and findings such as how long it took to run.

## Table of contents

### Properties

- [backtrace](ExecJSON.ControlResult.md#backtrace)
- [code\_desc](ExecJSON.ControlResult.md#code_desc)
- [exception](ExecJSON.ControlResult.md#exception)
- [message](ExecJSON.ControlResult.md#message)
- [resource](ExecJSON.ControlResult.md#resource)
- [resource\_id](ExecJSON.ControlResult.md#resource_id)
- [run\_time](ExecJSON.ControlResult.md#run_time)
- [skip\_message](ExecJSON.ControlResult.md#skip_message)
- [start\_time](ExecJSON.ControlResult.md#start_time)
- [status](ExecJSON.ControlResult.md#status)

## Properties

### backtrace

• `Optional` **backtrace**: ``null`` \| `string`[]

The stacktrace/backtrace of the exception if one occurred.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:239](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L239)

___

### code\_desc

• **code\_desc**: `string`

A description of this test.  Example: 'limits.conf * is expected to include ['hard',
'maxlogins', '10'].

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:244](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L244)

___

### exception

• `Optional` **exception**: ``null`` \| `string`

The type of exception if an exception was thrown.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:248](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L248)

___

### message

• `Optional` **message**: ``null`` \| `string`

An explanation of the test status - usually only provided when the test fails.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:252](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L252)

___

### resource

• `Optional` **resource**: ``null`` \| `string`

The resource used in the test.  Example: in Inspec, you can use the 'File' resource.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:256](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L256)

___

### resource\_id

• `Optional` **resource\_id**: ``null`` \| `string`

The unique identifier of the resource.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:260](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L260)

___

### run\_time

• `Optional` **run\_time**: ``null`` \| `number`

The execution time in seconds for the test.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:264](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L264)

___

### skip\_message

• `Optional` **skip\_message**: ``null`` \| `string`

An explanation of the test status if the status was 'skipped.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:268](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L268)

___

### start\_time

• **start\_time**: `string`

The time at which the test started.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:272](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L272)

___

### status

• `Optional` **status**: ``null`` \| [`ControlResultStatus`](../enums/ExecJSON.ControlResultStatus.md)

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:273](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L273)
