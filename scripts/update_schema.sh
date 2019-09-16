#!/bin/bash
# This script (will) automatically updates the parsers in "generated-parsers" based on the current inspec schema output.

# Show every line as it executes
# set -x
# Halt immediately on error
set -e

# Ensure we were given an argument
# [[ -n $1 ]] || { echo "Must supply a version number" >&2; exit 1; }
# set VERSION=$1
set VERSION="."

# Declare our schemas - those that we will ask inspec to generate
declare -a SCHEMAS=('exec-json' 'exec-jsonmin' 'profile-json')

# Make the schemas for each version we want
mkdir -p './work/schemas'
for SCHEMA in ${SCHEMAS[@]}
do
    echo Generating $SCHEMA
    # inspec schema $SCHEMA > work/schemas/$VERSION/$SCHEMA.json;
    echo '(TEMPORARILY DISABLED)'
done

# Quicktype each
echo "Generating types"
mkdir -p "./work/interfaces"
mkdir -p "./../generated_parsers/$VERSION"
for SCHEMA in ${SCHEMAS[@]}
do
    # Generate the parser
    OUTFILE="./../generated_parsers/$VERSION/$SCHEMA.ts"
    npx quicktype -l ts -s schema --src "./work/schemas/$VERSION/$SCHEMA.json" -o $OUTFILE --runtime-typecheck # --quiet

    # Modify it to utilize a null filter parser
    # Add the import
    sed -e '9i\
    import preprocess from "../preprocessor";' -i '' $OUTFILE
    # Add the call in stead of JSON.parse
    sed -e 's/return cast(JSON.parse(json)/return cast(preprocess(json)/' -i '' $OUTFILE
done

# Remove work directory trash
rm -r './work/interfaces'
# rm -r './work/schemas'