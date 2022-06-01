[inspecjs](../README.md) / [Exports](../modules.md) / ContextualizedProfile

# Interface: ContextualizedProfile

## Hierarchy

- `WrapsType`<[`AnyProfile`](../modules.md#anyprofile)\>

- `Sourced`<[`ContextualizedEvaluation`](ContextualizedEvaluation.md) \| ``null``\>

- `Contains`<[`ContextualizedControl`](ContextualizedControl.md)[]\>

- `Extendable`<[`ContextualizedProfile`](ContextualizedProfile.md)\>

  ↳ **`ContextualizedProfile`**

## Table of contents

### Properties

- [contains](ContextualizedProfile.md#contains)
- [data](ContextualizedProfile.md#data)
- [extendedBy](ContextualizedProfile.md#extendedby)
- [extendsFrom](ContextualizedProfile.md#extendsfrom)
- [sourcedFrom](ContextualizedProfile.md#sourcedfrom)

## Properties

### contains

• **contains**: [`ContextualizedControl`](ContextualizedControl.md)[]

#### Inherited from

Contains.contains

#### Defined in

[context.ts:59](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L59)

___

### data

• **data**: [`AnyProfile`](../modules.md#anyprofile)

#### Inherited from

WrapsType.data

#### Defined in

[context.ts:20](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L20)

___

### extendedBy

• **extendedBy**: [`ContextualizedProfile`](ContextualizedProfile.md)[]

What is this data extended by?
E.g. a profile that overlays this profile.
Can be empty.

#### Inherited from

Extendable.extendedBy

#### Defined in

[context.ts:43](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L43)

___

### extendsFrom

• **extendsFrom**: [`ContextualizedProfile`](ContextualizedProfile.md)[]

What data is this node extending?
E.g. is this overlaying a profile? Another control?
Can be empty.

#### Inherited from

Extendable.extendsFrom

#### Defined in

[context.ts:50](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L50)

___

### sourcedFrom

• **sourcedFrom**: ``null`` \| [`ContextualizedEvaluation`](ContextualizedEvaluation.md)

#### Inherited from

Sourced.sourcedFrom

#### Defined in

[context.ts:29](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L29)
