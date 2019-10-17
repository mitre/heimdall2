#!/bin/bash
# This script (will) automatically updates the parsers in "generated-parsers" based on the current inspec schema output.

# Show every line as it executes
# set -x
# Halt immediately on error
set -e

# Ensure we were given an argument
# [[ -n $1 ]] || { echo "Must supply a version number" >&2; exit 1; }
# set VERSION=$1
VERSION="."

# Declare our schemas - those that we will ask inspec to generate
declare -a SCHEMAS=('exec-json' 'exec-jsonmin' 'profile-json')

# Make the schemas for each version we want
mkdir -p './work/schemas'
for SCHEMA in ${SCHEMAS[@]}
do
    echo Generating $SCHEMA
    echo '(TEMPORARILY DISABLED)'
    # inspec schema $SCHEMA > work/schemas/$VERSION/$SCHEMA.json;

done

# Quicktype each
echo "Generating types"
mkdir -p "./work/interfaces"
mkdir -p "./src/generated_parsers/$VERSION"
for SCHEMA in ${SCHEMAS[@]}
do
    # Establish filenames
    OUTFILE="./src/generated_parsers/$VERSION/$SCHEMA.ts"
    SCHEMAFILE="./work/schemas/$VERSION/$SCHEMA.json"
    MODIFIED_SCHEMAFILE="./work/tmp_$SCHEMA.json"

    # Loosen the schema
    COMPAT="./scripts/schema_compat_patches"
    cat $SCHEMAFILE | . "$COMPAT/generic.sh" | . "$COMPAT/$SCHEMA.sh" | . "./scripts/null_compat_schema.sh" > $MODIFIED_SCHEMAFILE

    # Generate the parser
    npx quicktype -l ts -s schema --src $MODIFIED_SCHEMAFILE -o $OUTFILE --runtime-typecheck
    # rm $MODIFIED_SCHEMAFILE
done

# Remove work directory trash
rm -r './work/interfaces'
# rm -r './work/schemas'