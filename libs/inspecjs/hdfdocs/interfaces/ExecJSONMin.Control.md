[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSONMin](../modules/ExecJSONMin.md) / Control

# Interface: Control

[ExecJSONMin](../modules/ExecJSONMin.md).Control

The set of all tests within the control and their results and findings.

## Table of contents

### Properties

- [backtrace](ExecJSONMin.Control.md#backtrace)
- [code\_desc](ExecJSONMin.Control.md#code_desc)
- [exception](ExecJSONMin.Control.md#exception)
- [id](ExecJSONMin.Control.md#id)
- [message](ExecJSONMin.Control.md#message)
- [profile\_id](ExecJSONMin.Control.md#profile_id)
- [profile\_sha256](ExecJSONMin.Control.md#profile_sha256)
- [resource](ExecJSONMin.Control.md#resource)
- [skip\_message](ExecJSONMin.Control.md#skip_message)
- [status](ExecJSONMin.Control.md#status)

## Properties

### backtrace

• `Optional` **backtrace**: ``null`` \| `string`[]

The stacktrace/backtrace of the exception if one occurred.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:34](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L34)

___

### code\_desc

• **code\_desc**: `string`

A description of the control.  Example: 'limits.conf * is expected to include ['hard',
'maxlogins', '10'].

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:39](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L39)

___

### exception

• `Optional` **exception**: ``null`` \| `string`

The type of exception if an exception was thrown.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:43](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L43)

___

### id

• **id**: `string`

The id.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:47](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L47)

___

### message

• `Optional` **message**: ``null`` \| `string`

An explanation of the control status - usually only provided when the control fails.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:51](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L51)

___

### profile\_id

• `Optional` **profile\_id**: ``null`` \| `string`

The name of the profile that can uniquely identify it - is nullable.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:55](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L55)

___

### profile\_sha256

• **profile\_sha256**: `string`

The checksum of the profile.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:59](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L59)

___

### resource

• `Optional` **resource**: ``null`` \| `string`

The resource used in the test.  Example: in Inspec, you can use the 'File' resource.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:63](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L63)

___

### skip\_message

• `Optional` **skip\_message**: ``null`` \| `string`

An explanation of the status if the status was 'skipped'.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:67](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L67)

___

### status

• **status**: `string`

The status of the control.  Example: 'failed'.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:71](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L71)
