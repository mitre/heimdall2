[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSONMin](../modules/ExecJSONMin.md) / Execution

# Interface: Execution

[ExecJSONMin](../modules/ExecJSONMin.md).Execution

## Table of contents

### Properties

- [controls](ExecJSONMin.Execution.md#controls)
- [statistics](ExecJSONMin.Execution.md#statistics)
- [version](ExecJSONMin.Execution.md#version)

## Properties

### controls

• **controls**: [`Control`](ExecJSONMin.Control.md)[]

The set of controls including any findings as reported by the tool.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:14](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L14)

___

### statistics

• **statistics**: [`Statistics`](ExecJSONMin.Statistics.md)

Statistics for the run(s) from the tool that generated the findings.  Example: the
runtime duration.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:19](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L19)

___

### version

• **version**: `string`

Version number of the tool that generated the findings.  Example: '4.18.108' is a version
of Chef Inspec.

#### Defined in

[generated_parsers/v_1_0/exec-jsonmin.ts:24](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-jsonmin.ts#L24)
