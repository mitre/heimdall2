[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSON](../modules/ExecJSON.md) / Statistics

# Interface: Statistics

[ExecJSON](../modules/ExecJSON.md).Statistics

Statistics for the run(s) from the tool that generated the findings.  Example: the
runtime duration.

Statistics for the run(s) such as how long it took.

## Table of contents

### Properties

- [controls](ExecJSON.Statistics.md#controls)
- [duration](ExecJSON.Statistics.md#duration)

## Properties

### controls

• `Optional` **controls**: ``null`` \| [`StatisticHash`](ExecJSON.StatisticHash.md)

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:412](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L412)

___

### duration

• `Optional` **duration**: ``null`` \| `number`

How long (in seconds) this run by the tool was.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:416](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L416)
