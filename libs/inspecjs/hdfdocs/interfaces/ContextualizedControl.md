[inspecjs](../README.md) / [Exports](../modules.md) / ContextualizedControl

# Interface: ContextualizedControl

## Hierarchy

- `WrapsType`<[`AnyControl`](../modules.md#anycontrol)\>

- `Sourced`<[`ContextualizedProfile`](ContextualizedProfile.md)\>

- `Extendable`<[`ContextualizedControl`](ContextualizedControl.md)\>

  ↳ **`ContextualizedControl`**

## Table of contents

### Properties

- [data](ContextualizedControl.md#data)
- [extendedBy](ContextualizedControl.md#extendedby)
- [extendsFrom](ContextualizedControl.md#extendsfrom)
- [full\_code](ContextualizedControl.md#full_code)
- [hdf](ContextualizedControl.md#hdf)
- [root](ContextualizedControl.md#root)
- [sourcedFrom](ContextualizedControl.md#sourcedfrom)

## Properties

### data

• **data**: [`AnyControl`](../modules.md#anycontrol)

#### Inherited from

WrapsType.data

#### Defined in

[context.ts:20](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L20)

___

### extendedBy

• **extendedBy**: [`ContextualizedControl`](ContextualizedControl.md)[]

What is this data extended by?
E.g. a profile that overlays this profile.
Can be empty.

#### Inherited from

Extendable.extendedBy

#### Defined in

[context.ts:43](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L43)

___

### extendsFrom

• **extendsFrom**: [`ContextualizedControl`](ContextualizedControl.md)[]

What data is this node extending?
E.g. is this overlaying a profile? Another control?
Can be empty.

#### Inherited from

Extendable.extendsFrom

#### Defined in

[context.ts:50](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L50)

___

### full\_code

• **full\_code**: `string`

Yields the full code of this control, by concatenating overlay code.

#### Defined in

[context.ts:84](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L84)

___

### hdf

• **hdf**: [`HDFControl`](HDFControl.md)

The HDF version of this particular control

#### Defined in

[context.ts:78](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L78)

___

### root

• **root**: [`ContextualizedControl`](ContextualizedControl.md)

Drills down to this controls root CC. In general you should use this for all data operations

#### Defined in

[context.ts:81](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L81)

___

### sourcedFrom

• **sourcedFrom**: [`ContextualizedProfile`](ContextualizedProfile.md)

#### Inherited from

Sourced.sourcedFrom

#### Defined in

[context.ts:29](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L29)
