#!/bin/bash
# This script (will) automatically updates the parsers in "generated-parsers" based on the current inspec schema output.
# Halt immediately on error
set -e
VERSION="v_1_0"

# Declare our schemas - those that we will ask inspec to generate
declare -a SCHEMAS=('exec-json' 'exec-jsonmin' 'profile-json')

# Quicktype each
echo "Generating types"
mkdir -p "./work/interfaces"
mkdir -p "./src/generated_parsers/$VERSION"
for SCHEMA in ${SCHEMAS[@]}
do
    # Establish filenames
    OUTFILE="./src/generated_parsers/$VERSION/$SCHEMA.ts"
    SCHEMAFILE="./schemas/$SCHEMA.json"
    MODIFIED_SCHEMAFILE="./work/tmp_$SCHEMA.json"

    # Loosen the schema
    COMPAT="./scripts/schema_compat_patches"
    cat $SCHEMAFILE | . "$COMPAT/generic.sh" | . "$COMPAT/$SCHEMA.sh" | . "./scripts/null_compat_schema.sh" > $MODIFIED_SCHEMAFILE
    # Generate the parser
    quicktype -l ts -s schema --src $MODIFIED_SCHEMAFILE -o $OUTFILE --runtime-typecheck
    rm $MODIFIED_SCHEMAFILE
done
# Remove work directory trash
rm -r './work'
