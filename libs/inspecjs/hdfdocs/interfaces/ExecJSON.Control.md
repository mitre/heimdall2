[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSON](../modules/ExecJSON.md) / Control

# Interface: Control

[ExecJSON](../modules/ExecJSON.md).Control

Describes a control and any findings it has.

## Table of contents

### Properties

- [code](ExecJSON.Control.md#code)
- [desc](ExecJSON.Control.md#desc)
- [descriptions](ExecJSON.Control.md#descriptions)
- [id](ExecJSON.Control.md#id)
- [impact](ExecJSON.Control.md#impact)
- [refs](ExecJSON.Control.md#refs)
- [results](ExecJSON.Control.md#results)
- [source\_location](ExecJSON.Control.md#source_location)
- [tags](ExecJSON.Control.md#tags)
- [title](ExecJSON.Control.md#title)
- [waiver\_data](ExecJSON.Control.md#waiver_data)

## Properties

### code

• `Optional` **code**: ``null`` \| `string`

The raw source code of the control. Note that if this is an overlay control, it does not
include the underlying source code.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:156](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L156)

___

### desc

• `Optional` **desc**: ``null`` \| `string`

The description for the overarching control.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:160](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L160)

___

### descriptions

• `Optional` **descriptions**: ``null`` \| [`ControlDescription`](ExecJSON.ControlDescription.md)[]

A set of additional descriptions.  Example: the 'fix' text.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:164](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L164)

___

### id

• **id**: `string`

The id.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:168](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L168)

___

### impact

• **impact**: `number`

The impactfulness or severity.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:172](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L172)

___

### refs

• **refs**: [`Reference`](ExecJSON.Reference.md)[]

The set of references to external documents.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:176](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L176)

___

### results

• **results**: [`ControlResult`](ExecJSON.ControlResult.md)[]

The set of all tests within the control and their results and findings.
Example:
For Chef Inspec, if in the control's code we had the following:
describe sshd_config do
its('Port') { should cmp 22 }
end
The findings from this block would be appended to the results, as well as those of any
other blocks within the control.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:187](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L187)

___

### source\_location

• **source\_location**: [`SourceLocation`](ExecJSON.SourceLocation.md)

The explicit location of the control within the source code.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:191](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L191)

___

### tags

• **tags**: `Object`

A set of tags - usually metadata.

#### Index signature

▪ [key: `string`]: `any`

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:195](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L195)

___

### title

• `Optional` **title**: ``null`` \| `string`

The title - is nullable.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:199](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L199)

___

### waiver\_data

• `Optional` **waiver\_data**: ``null`` \| [`ControlWaiverData`](ExecJSON.ControlWaiverData.md)

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:200](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L200)
