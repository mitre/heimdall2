#!/bin/sh

jq '.
# Make source location not demand line and ref
| .definitions["Source_Location"].required = []
' <&0