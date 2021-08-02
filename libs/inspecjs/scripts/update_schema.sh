#!/bin/bash
# This script (will) automatically updates the parsers in "generated-parsers" based on the current inspec schema output.
# Halt immediately on error
set -e
VERSION="v_1_0"

# Declare our schemas - those that we will ask inspec to generate
declare -a SCHEMAS=('exec-json' 'exec-jsonmin' 'profile-json')

# Quicktype each
echo "Generating modified schemas and types"
mkdir -p "./src/generated_parsers/$VERSION"
for SCHEMA in ${SCHEMAS[@]}
do
    # Establish filenames
    OUTFILE="./src/generated_parsers/$VERSION/$SCHEMA.ts"
    SCHEMAFILE="./schemas/$SCHEMA.json"

    # Loosen the schema
    COMPAT="./scripts/schema_compat_patches"
    echo "Generating $SCHEMA"
    inspec schema $SCHEMA --chef-license=accept-silent | . "$COMPAT/generic.sh" | . "$COMPAT/$SCHEMA.sh" | . "./scripts/null_compat_schema.sh" > $SCHEMAFILE
    # Generate the parser
    echo "Generating types"
    quicktype -l ts -s schema --src $SCHEMAFILE -o $OUTFILE --runtime-typecheck
done
