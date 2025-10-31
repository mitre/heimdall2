https://www.oasis-open.org/committees/tc_home.php?wg_abbrev=sarif
https://docs.oasis-open.org/sarif/sarif/v2.1.0/sarif-v2.1.0.html
https://docs.oasis-open.org/sarif/sarif/v2.1.0/errata01/os/schemas/sarif-schema-2.1.0.json

npx --package=json-schema-to-typescript json2ts -i schemas/sarif/2.1.0/sarif-schema-2.1.0.json -o schemas/sarif/2.1.0/sarif.d.ts

A substantial amount of manual tweaking is required since it seems to have created duplicate types during its automated process that share the same name but have different numbers at the end.  I removed all the duplicates and ensured that all the types pointed at the original version.  This file is types/sarif.d.ts.
