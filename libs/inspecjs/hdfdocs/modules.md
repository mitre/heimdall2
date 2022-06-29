[inspecjs](README.md) / Exports

# inspecjs

## Table of contents

### Namespaces

- [ExecJSON](modules/ExecJSON.md)
- [ExecJSONMin](modules/ExecJSONMin.md)
- [ProfileJSON](modules/ProfileJSON.md)

### Classes

- [NistControl](classes/NistControl.md)
- [NistRevision](classes/NistRevision.md)

### Interfaces

- [CanonizationConfig](interfaces/CanonizationConfig.md)
- [CategoryItemRequirements](interfaces/CategoryItemRequirements.md)
- [ContextualizedControl](interfaces/ContextualizedControl.md)
- [ContextualizedEvaluation](interfaces/ContextualizedEvaluation.md)
- [ContextualizedProfile](interfaces/ContextualizedProfile.md)
- [ConversionResult](interfaces/ConversionResult.md)
- [HDFControl](interfaces/HDFControl.md)
- [HDFControlSegment](interfaces/HDFControlSegment.md)
- [NistHierarchyNode](interfaces/NistHierarchyNode.md)

### Type Aliases

- [AnyControl](modules.md#anycontrol)
- [AnyEval](modules.md#anyeval)
- [AnyEvalControl](modules.md#anyevalcontrol)
- [AnyEvalProfile](modules.md#anyevalprofile)
- [AnyExec](modules.md#anyexec)
- [AnyProfile](modules.md#anyprofile)
- [ControlGroupStatus](modules.md#controlgroupstatus)
- [ControlStatus](modules.md#controlstatus)
- [ConversionErrors](modules.md#conversionerrors)
- [NistHierarchy](modules.md#nisthierarchy)
- [SegmentStatus](modules.md#segmentstatus)
- [Severity](modules.md#severity)

### Variables

- [FULL\_NIST\_HIERARCHY](modules.md#full_nist_hierarchy)

### Functions

- [compare\_statuses](modules.md#compare_statuses)
- [contextualizeEvaluation](modules.md#contextualizeevaluation)
- [contextualizeProfile](modules.md#contextualizeprofile)
- [convertFile](modules.md#convertfile)
- [convertFileContextual](modules.md#convertfilecontextual)
- [hdfWrapControl](modules.md#hdfwrapcontrol)
- [isContextualizedEvaluation](modules.md#iscontextualizedevaluation)
- [isContextualizedProfile](modules.md#iscontextualizedprofile)
- [is\_control](modules.md#is_control)
- [is\_revision](modules.md#is_revision)
- [parse\_nist](modules.md#parse_nist)
- [updateStatus](modules.md#updatestatus)

## Type Aliases

### AnyControl

Ƭ **AnyControl**: [`Control`](interfaces/ProfileJSON.Control.md) \| [`Control`](interfaces/ExecJSON.Control.md)

#### Defined in

[fileparse.ts:87](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L87)

___

### AnyEval

Ƭ **AnyEval**: [`AnyExec`](modules.md#anyexec)

#### Defined in

[fileparse.ts:80](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L80)

___

### AnyEvalControl

Ƭ **AnyEvalControl**: [`Control`](interfaces/ExecJSON.Control.md)

#### Defined in

[fileparse.ts:90](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L90)

___

### AnyEvalProfile

Ƭ **AnyEvalProfile**: [`Profile`](interfaces/ExecJSON.Profile.md)

#### Defined in

[fileparse.ts:85](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L85)

___

### AnyExec

Ƭ **AnyExec**: [`Execution`](interfaces/ExecJSON.Execution.md)

#### Defined in

[fileparse.ts:79](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L79)

___

### AnyProfile

Ƭ **AnyProfile**: [`Profile`](interfaces/ProfileJSON.Profile.md) \| [`Profile`](interfaces/ExecJSON.Profile.md)

#### Defined in

[fileparse.ts:82](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L82)

___

### ControlGroupStatus

Ƭ **ControlGroupStatus**: [`ControlStatus`](modules.md#controlstatus) \| ``"Empty"``

#### Defined in

[nist.ts:243](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L243)

___

### ControlStatus

Ƭ **ControlStatus**: ``"Not Applicable"`` \| ``"From Profile"`` \| ``"Profile Error"`` \| ``"Passed"`` \| ``"Failed"`` \| ``"Not Reviewed"``

The statuses that a control might have.

This is computed as follows:
1. any kind of error -> "Profile Error"
2. impact 0 -> "Not Applicable" (except if #1)
3. has any failed tests -> "Failed" (except if #1 or #2)
4. has skip and pass -> "Passed" (except if #1 or #2)
5. all tests within a control pass -> "Passed" (except if #1 or #2)
6. only skips -> Requires Manual Review (except if #1 or #2)
7. No data at all (but from exec) -> "Profile Error"
8. from profile -> "From Profile"
These cases are in theory comprehensive, but if somehow no apply, it is still Profile Error

#### Defined in

[compat_wrappers.ts:26](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L26)

___

### ConversionErrors

Ƭ **ConversionErrors**: { [K in keyof ConversionResults]?: unknown }

#### Defined in

[fileparse.ts:22](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L22)

___

### NistHierarchy

Ƭ **NistHierarchy**: [`NistHierarchyNode`](interfaces/NistHierarchyNode.md)[]

#### Defined in

[nist.ts:297](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L297)

___

### SegmentStatus

Ƭ **SegmentStatus**: ``"passed"`` \| ``"failed"`` \| ``"skipped"`` \| ``"error"`` \| ``"no_status"``

The statuses that a segment of a control (IE a describe block) might have.

#### Defined in

[compat_wrappers.ts:44](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L44)

___

### Severity

Ƭ **Severity**: ``"none"`` \| ``"low"`` \| ``"medium"`` \| ``"high"`` \| ``"critical"``

The severities a control can have. These map numeric impact values to No/Low/Medium/High/Crtiical impact
[0, 0.01) => No impact
[0.01, 0.4) => Low impact
[0.4, 0.7) => Medium impact
[0.7, 0.9) => High impact
[0.9, 1.0] => Critical impact

#### Defined in

[compat_wrappers.ts:41](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L41)

## Variables

### FULL\_NIST\_HIERARCHY

• `Const` **FULL\_NIST\_HIERARCHY**: `Readonly`<[`NistHierarchy`](modules.md#nisthierarchy)\>

#### Defined in

[nist.ts:384](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L384)

## Functions

### compare\_statuses

▸ **compare_statuses**(`a`, `b`): `number`

Computes the groups status having added control.
There's a natural precedence to statuses, at least in a list/group
For instance, we would not mark a group as Passed if it contained a Failed.
Clearly "Empty" is the lowest precedence, as adding any control would wipe it out.
Following we have "From Profile" since it is in some way the absence of status, but also lacks run context. We care more about literally anything else
Next, "Not Applicable" since it means that though we ran we don't care about the result
"Not Reviewed" implies that had the test run it would've mattered, but it was skipped deliberately
"No Data" is similarly a lack of result, but in this case unexpected, and thus worthy of more scrutiny
"Passed" means that a test passed! But "Failed" should override, since fails are really what we're looking for
Finally, "Profile Errors" mean something is broken and needs to be fixed, and thus overrides all

Returns:
< 0  if a < b (by the above criteria)
0    if a === b
> 0  if a > b

#### Parameters

| Name | Type |
| :------ | :------ |
| `a` | [`ControlGroupStatus`](modules.md#controlgroupstatus) |
| `b` | [`ControlGroupStatus`](modules.md#controlgroupstatus) |

#### Returns

`number`

#### Defined in

[nist.ts:262](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L262)

___

### contextualizeEvaluation

▸ **contextualizeEvaluation**(`evaluation`): [`ContextualizedEvaluation`](interfaces/ContextualizedEvaluation.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `evaluation` | [`Execution`](interfaces/ExecJSON.Execution.md) |

#### Returns

[`ContextualizedEvaluation`](interfaces/ContextualizedEvaluation.md)

#### Defined in

[context.ts:153](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L153)

___

### contextualizeProfile

▸ **contextualizeProfile**(`profile`): [`ContextualizedProfile`](interfaces/ContextualizedProfile.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `profile` | [`AnyProfile`](modules.md#anyprofile) |

#### Returns

[`ContextualizedProfile`](interfaces/ContextualizedProfile.md)

#### Defined in

[context.ts:266](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/context.ts#L266)

___

### convertFile

▸ **convertFile**(`jsonText`, `keepErrors?`): [`ConversionResult`](interfaces/ConversionResult.md)

Try to convert the given json text into a valid profile.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `jsonText` | `string` | `undefined` | The json file contents |
| `keepErrors` | `boolean` | `false` | - |

#### Returns

[`ConversionResult`](interfaces/ConversionResult.md)

#### Defined in

[fileparse.ts:32](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L32)

___

### convertFileContextual

▸ **convertFileContextual**(`jsonText`): [`ContextualizedEvaluation`](interfaces/ContextualizedEvaluation.md) \| [`ContextualizedProfile`](interfaces/ContextualizedProfile.md)

Converts a file and makes a contextual datum of it

#### Parameters

| Name | Type |
| :------ | :------ |
| `jsonText` | `string` |

#### Returns

[`ContextualizedEvaluation`](interfaces/ContextualizedEvaluation.md) \| [`ContextualizedProfile`](interfaces/ContextualizedProfile.md)

#### Defined in

[fileparse.ts:95](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L95)

___

### hdfWrapControl

▸ **hdfWrapControl**(`ctrl`): [`HDFControl`](interfaces/HDFControl.md)

Wrapper to guarantee certain HDF properties on a control, or at least provide
type safed accessors.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ctrl` | [`AnyControl`](modules.md#anycontrol) | The control to polyfill |

#### Returns

[`HDFControl`](interfaces/HDFControl.md)

#### Defined in

[compat_wrappers.ts:186](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L186)

___

### isContextualizedEvaluation

▸ **isContextualizedEvaluation**(`v`): v is ContextualizedEvaluation

#### Parameters

| Name | Type |
| :------ | :------ |
| `v` | [`ContextualizedEvaluation`](interfaces/ContextualizedEvaluation.md) \| [`ContextualizedProfile`](interfaces/ContextualizedProfile.md) |

#### Returns

v is ContextualizedEvaluation

#### Defined in

[fileparse.ts:115](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L115)

___

### isContextualizedProfile

▸ **isContextualizedProfile**(`v`): v is ContextualizedProfile

#### Parameters

| Name | Type |
| :------ | :------ |
| `v` | [`ContextualizedEvaluation`](interfaces/ContextualizedEvaluation.md) \| [`ContextualizedProfile`](interfaces/ContextualizedProfile.md) |

#### Returns

v is ContextualizedProfile

#### Defined in

[fileparse.ts:121](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/fileparse.ts#L121)

___

### is\_control

▸ **is_control**(`x`): x is NistControl

Simple discriminators

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | ``null`` \| [`NistControl`](classes/NistControl.md) \| [`NistRevision`](classes/NistRevision.md) |

#### Returns

x is NistControl

#### Defined in

[nist.ts:217](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L217)

___

### is\_revision

▸ **is_revision**(`x`): x is NistRevision

Simple discriminators

#### Parameters

| Name | Type |
| :------ | :------ |
| `x` | ``null`` \| [`NistControl`](classes/NistControl.md) \| [`NistRevision`](classes/NistRevision.md) |

#### Returns

x is NistRevision

#### Defined in

[nist.ts:227](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L227)

___

### parse\_nist

▸ **parse_nist**(`rawNist`): `ParseNist`

#### Parameters

| Name | Type |
| :------ | :------ |
| `rawNist` | `string` |

#### Returns

`ParseNist`

#### Defined in

[nist.ts:183](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L183)

___

### updateStatus

▸ **updateStatus**(`group`, `control`): [`ControlGroupStatus`](modules.md#controlgroupstatus)

#### Parameters

| Name | Type |
| :------ | :------ |
| `group` | [`ControlGroupStatus`](modules.md#controlgroupstatus) |
| `control` | [`ControlStatus`](modules.md#controlstatus) |

#### Returns

[`ControlGroupStatus`](modules.md#controlgroupstatus)

#### Defined in

[nist.ts:280](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/nist.ts#L280)
