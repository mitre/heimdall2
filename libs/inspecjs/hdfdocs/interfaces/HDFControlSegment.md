[inspecjs](../README.md) / [Exports](../modules.md) / HDFControlSegment

# Interface: HDFControlSegment

Represents a single describe blocks execution in our test,
and data related to its execution

## Table of contents

### Properties

- [backtrace](HDFControlSegment.md#backtrace)
- [code\_desc](HDFControlSegment.md#code_desc)
- [exception](HDFControlSegment.md#exception)
- [message](HDFControlSegment.md#message)
- [resource](HDFControlSegment.md#resource)
- [run\_time](HDFControlSegment.md#run_time)
- [skip\_message](HDFControlSegment.md#skip_message)
- [start\_time](HDFControlSegment.md#start_time)
- [status](HDFControlSegment.md#status)

## Properties

### backtrace

• `Optional` **backtrace**: `string`[]

A line by line trace of where this.exception occurred

#### Defined in

[compat_wrappers.ts:160](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L160)

___

### code\_desc

• **code\_desc**: `string`

The description of this particular segment

#### Defined in

[compat_wrappers.ts:151](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L151)

___

### exception

• `Optional` **exception**: `string`

A string describing the error/exception this segment encountered (if one was encountered)

#### Defined in

[compat_wrappers.ts:157](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L157)

___

### message

• `Optional` **message**: `string`

The message that inspec produced describing this segment's result

#### Defined in

[compat_wrappers.ts:148](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L148)

___

### resource

• `Optional` **resource**: `string`

Which inspec resource this control used, if one could be determined

#### Defined in

[compat_wrappers.ts:177](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L177)

___

### run\_time

• `Optional` **run\_time**: `number`

The run time of this segment, in seconds

#### Defined in

[compat_wrappers.ts:174](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L174)

___

### skip\_message

• `Optional` **skip\_message**: `string`

A message describing why this segment was skipped (if it was skipped)

#### Defined in

[compat_wrappers.ts:154](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L154)

___

### start\_time

• **start\_time**: `string`

The start time of this segment, which is typically in the format.

yyyy-mm-ddThh:mm:ss+|-HH:MM

Where yyyy is year, mm d=month, dd day, hh hour, mm minute, ss second,
plus or minus HH:MM s the time zone offset.

However, this isn't guaranteed

#### Defined in

[compat_wrappers.ts:171](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L171)

___

### status

• **status**: [`SegmentStatus`](../modules.md#segmentstatus)

The result of this particular segment

#### Defined in

[compat_wrappers.ts:145](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/compat_wrappers.ts#L145)
