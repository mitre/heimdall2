[inspecjs](../README.md) / [Exports](../modules.md) / [ProfileJSON](../modules/ProfileJSON.md) / Control

# Interface: Control

[ProfileJSON](../modules/ProfileJSON.md).Control

The set of all tests within the control.

## Table of contents

### Properties

- [code](ProfileJSON.Control.md#code)
- [desc](ProfileJSON.Control.md#desc)
- [descriptions](ProfileJSON.Control.md#descriptions)
- [id](ProfileJSON.Control.md#id)
- [impact](ProfileJSON.Control.md#impact)
- [refs](ProfileJSON.Control.md#refs)
- [source\_location](ProfileJSON.Control.md#source_location)
- [tags](ProfileJSON.Control.md#tags)
- [title](ProfileJSON.Control.md#title)

## Properties

### code

• **code**: `string`

The raw source code of the control. Note that if this is an overlay control, it does not
include the underlying source code.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:79](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L79)

___

### desc

• `Optional` **desc**: ``null`` \| `string`

The description for the overarching control.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:83](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L83)

___

### descriptions

• `Optional` **descriptions**: ``null`` \| { `[key: string]`: `string`;  }

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:84](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L84)

___

### id

• **id**: `string`

The id.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:88](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L88)

___

### impact

• **impact**: `number`

The impactfulness or severity.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:92](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L92)

___

### refs

• `Optional` **refs**: ``null`` \| [`Reference`](ProfileJSON.Reference.md)[]

The set of references to external documents.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:96](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L96)

___

### source\_location

• `Optional` **source\_location**: ``null`` \| [`SourceLocation`](ProfileJSON.SourceLocation.md)

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:97](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L97)

___

### tags

• **tags**: `Object`

A set of tags - usually metadata.

#### Index signature

▪ [key: `string`]: `any`

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:101](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L101)

___

### title

• `Optional` **title**: ``null`` \| `string`

The title - is nullable.

#### Defined in

[generated_parsers/v_1_0/profile-json.ts:105](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/profile-json.ts#L105)
