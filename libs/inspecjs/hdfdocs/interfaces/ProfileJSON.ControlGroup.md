[inspecjs](../README.md) / [Exports](../modules.md) / [ProfileJSON](../modules/ProfileJSON.md) / ControlGroup

# Interface: ControlGroup

[ProfileJSON](../modules/ProfileJSON.md).ControlGroup

Descriptions for controls in a group, such as the list of all the controls.

## Table of contents

### Properties

- [controls](ProfileJSON.ControlGroup.md#controls)
- [id](ProfileJSON.ControlGroup.md#id)
- [title](ProfileJSON.ControlGroup.md#title)

## Properties

### controls

• **controls**: `string`[]

The set of controls as specified by their ids in this group.  Example: 'V-75443'.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:204](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L204)

___

### id

• **id**: `string`

The unique identifier for the group.  Example: the relative path to the file specifying
the controls.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:209](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L209)

___

### title

• `Optional` **title**: ``null`` \| `string`

The title of the group - should be human readable.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:213](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L213)
