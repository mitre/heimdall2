[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSON](../modules/ExecJSON.md) / ControlGroup

# Interface: ControlGroup

[ExecJSON](../modules/ExecJSON.md).ControlGroup

Descriptions for controls in a group, such as the list of all the controls.

## Table of contents

### Properties

- [controls](ExecJSON.ControlGroup.md#controls)
- [id](ExecJSON.ControlGroup.md#id)
- [title](ExecJSON.ControlGroup.md#title)

## Properties

### controls

• **controls**: `string`[]

The set of controls as specified by their ids in this group.  Example: 'V-75443'.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:363](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L363)

___

### id

• **id**: `string`

The unique identifier for the group.  Example: the relative path to the file specifying
the controls.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:368](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L368)

___

### title

• `Optional` **title**: ``null`` \| `string`

The title of the group - should be human readable.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:372](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L372)
