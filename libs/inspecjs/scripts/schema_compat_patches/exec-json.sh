#!/bin/sh

jq '.
# Make statistic duration optional
| .definitions["Statistics"].required = []

# Naturally, if we have results we will also not know specifically how long they last
| .definitions["Control_Result"].required -= ["run_time"]

# And code as well because sometimes, it just aint there (e.g. web stuff)
| .definitions["Exec_JSON_Control"].required -= ["code"]

' <&0