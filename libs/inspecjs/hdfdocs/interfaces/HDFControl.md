[inspecjs](../README.md) / [Exports](../modules.md) / HDFControl

# Interface: HDFControl

This interface acts as a polyfill on controls for our HDF "guaranteed" derived types, to provide a stable
method for acessing their properties across different schemas.

## Table of contents

### Properties

- [descriptions](HDFControl.md#descriptions)
- [finding\_details](HDFControl.md#finding_details)
- [isProfile](HDFControl.md#isprofile)
- [message](HDFControl.md#message)
- [parsedNistRevision](HDFControl.md#parsednistrevision)
- [parsedNistTags](HDFControl.md#parsednisttags)
- [rawNistTags](HDFControl.md#rawnisttags)
- [segments](HDFControl.md#segments)
- [severity](HDFControl.md#severity)
- [start\_time](HDFControl.md#start_time)
- [status](HDFControl.md#status)
- [status\_list](HDFControl.md#status_list)
- [waived](HDFControl.md#waived)
- [wraps](HDFControl.md#wraps)

### Methods

- [canonized\_nist](HDFControl.md#canonized_nist)

## Properties

### descriptions

• **descriptions**: `Object`

Maps string labels to description items.

#### Index signature

▪ [key: `string`]: `string`

#### Defined in

[compat_wrappers.ts:133](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L133)

___

### finding\_details

• **finding\_details**: `string`

Returns a user-facing representation of the result of this status, consisting of a message explaining
this controls status, followed by the contents of this.message.

#### Defined in

[compat_wrappers.ts:90](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L90)

___

### isProfile

• **isProfile**: `boolean`

Easy check if this is a profile

#### Defined in

[compat_wrappers.ts:130](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L130)

___

### message

• **message**: `string`

A string that essentially acts as a user-facing log of the results of the success/failure of each
part of the control's code.
This variable is UNSTABLE and should not be used as a ground-truth for testing, as it's format may be changed
in the future.

#### Defined in

[compat_wrappers.ts:76](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L76)

___

### parsedNistRevision

• **parsedNistRevision**: ``null`` \| [`NistRevision`](../classes/NistRevision.md)

Returns the revision of the nist tags, if it was found.

#### Defined in

[compat_wrappers.ts:110](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L110)

___

### parsedNistTags

• **parsedNistTags**: [`NistControl`](../classes/NistControl.md)[]

Returns the nist tags parsed and filtered to only include valid tags.
If unmapped, will be effectively UM-1.
Sorted lexicographically, first by family, then by corresponding sub-specifiers.

#### Defined in

[compat_wrappers.ts:97](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L97)

___

### rawNistTags

• **rawNistTags**: `string`[]

Returns the nist tags if they exist.
If they don't, simply returns empty array.
If you want auto resolving, use fixed_nist_tags

#### Defined in

[compat_wrappers.ts:84](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L84)

___

### segments

• `Optional` **segments**: [`HDFControlSegment`](HDFControlSegment.md)[]

Access the segments of this control in HDF format.
If no tests were run, (this is a profile-json) returns undefined.

#### Defined in

[compat_wrappers.ts:127](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L127)

___

### severity

• **severity**: [`Severity`](../modules.md#severity)

#### Defined in

[compat_wrappers.ts:68](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L68)

___

### start\_time

• `Optional` **start\_time**: `string`

Get the start time of this control's run, as determiend by the time of the first test.
If no tests were run, (it is a profile-json or has no tests) returns undefined

#### Defined in

[compat_wrappers.ts:115](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L115)

___

### status

• **status**: [`ControlStatus`](../modules.md#controlstatus)

Get the control status as computed for the entire control.
See the below for discussion of how this should be computed.
https://github.com/mitre/heimdall-vuetify/issues/57

#### Defined in

[compat_wrappers.ts:66](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L66)

___

### status\_list

• `Optional` **status\_list**: [`SegmentStatus`](../modules.md#segmentstatus)[]

Get the results of this control's control segments  as a list.
If no tests were run, (this is a profile-json) returns undefined.
Can be empty in the rare case that no control segments exist/were run.

#### Defined in

[compat_wrappers.ts:121](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L121)

___

### waived

• **waived**: `boolean`

Returns whether this control was waived.

#### Defined in

[compat_wrappers.ts:136](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L136)

___

### wraps

• **wraps**: [`AnyControl`](../modules.md#anycontrol)

The control that this interface wraps

#### Defined in

[compat_wrappers.ts:59](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L59)

## Methods

### canonized\_nist

▸ **canonized_nist**(`config`): `string`[]

Processes all of this controls nist tags to the given spec.
Since this is derived from parsedNistTags, this will also be
lexicographically sorted.
It is also deduplicated!

#### Parameters

| Name | Type |
| :------ | :------ |
| `config` | [`CanonizationConfig`](CanonizationConfig.md) |

#### Returns

`string`[]

#### Defined in

[compat_wrappers.ts:105](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L105)
