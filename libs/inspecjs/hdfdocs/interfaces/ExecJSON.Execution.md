[inspecjs](../README.md) / [Exports](../modules.md) / [ExecJSON](../modules/ExecJSON.md) / Execution

# Interface: Execution

[ExecJSON](../modules/ExecJSON.md).Execution

The top level value containing all of the results.

## Table of contents

### Properties

- [platform](ExecJSON.Execution.md#platform)
- [profiles](ExecJSON.Execution.md#profiles)
- [statistics](ExecJSON.Execution.md#statistics)
- [version](ExecJSON.Execution.md#version)

## Properties

### platform

• **platform**: [`Platform`](ExecJSON.Platform.md)

Information on the platform the run from the tool that generated the findings was from.
Example: the name of the operating system.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:18](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L18)

___

### profiles

• **profiles**: [`Profile`](ExecJSON.Profile.md)[]

Information on the run(s) from the tool that generated the findings.  Example: the
findings.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:23](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L23)

___

### statistics

• **statistics**: [`Statistics`](ExecJSON.Statistics.md)

Statistics for the run(s) from the tool that generated the findings.  Example: the
runtime duration.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:28](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L28)

___

### version

• **version**: `string`

Version number of the tool that generated the findings.  Example: '4.18.108' is a version
of Chef InSpec.

#### Defined in

[generated_parsers/v_1_0/exec-json.ts:33](https://github.com/mitre/heimdall2/blob/23640835/libs/inspecjs/src/generated_parsers/v_1_0/exec-json.ts#L33)
