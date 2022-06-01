[inspecjs](../README.md) / [Exports](../modules.md) / NistControl

# Class: NistControl

Represents a single nist control, or group of controls if the sub specs are vague enoug.

## Table of contents

### Constructors

- [constructor](NistControl.md#constructor)

### Properties

- [rawText](NistControl.md#rawtext)
- [subSpecifiers](NistControl.md#subspecifiers)

### Accessors

- [family](NistControl.md#family)

### Methods

- [canonize](NistControl.md#canonize)
- [compare\_lineage](NistControl.md#compare_lineage)
- [contains](NistControl.md#contains)
- [localCompare](NistControl.md#localcompare)

## Constructors

### constructor

• **new NistControl**(`subSpecs`, `rawRext?`)

Trivial constructor

#### Parameters

| Name | Type |
| :------ | :------ |
| `subSpecs` | `string`[] |
| `rawRext?` | `string` |

#### Defined in

[nist.ts:48](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L48)

## Properties

### rawText

• `Optional` **rawText**: `string`

Holds the string from which this control was generated.

#### Defined in

[nist.ts:45](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L45)

___

### subSpecifiers

• **subSpecifiers**: `string`[]

The sequence of sub-specifiers making up the "parts" of the nist tags
E.g.  in "SI-7 (14)(b)", we would have ["SI", "7", "14", "b"]
      in "SI-4a.2.", we would have ["SI", "4", "a, "2"];
First element is guaranteed to be a 2-letter family
Note that we strip punctuation

#### Defined in

[nist.ts:42](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L42)

## Accessors

### family

• `get` **family**(): `undefined` \| `string`

Quick accessor to the leading family letters for the nsit control

#### Returns

`undefined` \| `string`

#### Defined in

[nist.ts:113](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L113)

## Methods

### canonize

▸ **canonize**(`config`): `string`

Returns the "canonical" representation of this control, based on the provided parameters.
This is, unfortunately, slightly expensive.
Avoid repeating this if possible.

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`CanonizationConfig`](../interfaces/CanonizationConfig.md) |

#### Returns

`string`

#### Defined in

[nist.ts:126](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L126)

___

### compare\_lineage

▸ **compare_lineage**(`other`): `number`

This function compares this nist control to another nist control.
If the other control is the same control as this one, returns 0.

If the other control is a child of this control
(IE it is the same base directives with further enhancements, e.g. `IA-4` -> `IA-4b.` or `AC-9a.` -> `AC-9a. (2)`)
and returns how many further enhancements have been applied (IE what is the number of additional subdirectives.)

If the other control is NOT a child of this control, return -1

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`NistControl`](NistControl.md) |

#### Returns

`number`

#### Defined in

[nist.ts:69](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L69)

___

### contains

▸ **contains**(`other`): `boolean`

This function checks if the given control is contained by or equivalent to this control.
It is purely a wrapper around compare_lineage

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`NistControl`](NistControl.md) |

#### Returns

`boolean`

#### Defined in

[nist.ts:56](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L56)

___

### localCompare

▸ **localCompare**(`other`): `number`

Gives a numeric value indicating how these controls compare, lexicographically.
See string.localCompare for the output format.

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`NistControl`](NistControl.md) |

#### Returns

`number`

#### Defined in

[nist.ts:90](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L90)
