# Checklist Schema
Within this directory are the contents of checklist schema versions and their associated automated output from parsers and compilers. The current directory layout is as follows:

```bash
├── 2.5 # Version number found in the Schema file
│   ├── U_Checklist_Schema_V2.xsd # unaltered schema filename
│   └── jsonix-compiler-output # manually created 
│       ├── CKL.js # mapping object file from compiler output
│       └── CKL.jsonschema # schema file from --generateJsonSchema flag and used with QuickType to generate type file
└── README.md
```
Once a newer version is published, a new version number directory should be added. Under that the schema file along with a directory named jsonix-compiler-output and the two automated files created from the [JSONIX Library](https://github.com/mitre/heimdall2/wiki/HDF-Converters-How-Tos#jsonix) section of the OHDF Converters How Tos Documentation.

## How to Retrieve Latest Version

The checklist schema is found within the StigViewer source code. The easiest way to access this file is to crack open the .jar using the jd-gui (Java Decompiler) tool.  
Using the resource links below, run the following command to run the Java Compiler `java -jar jd-gui-1.6.6.jar` from the directory the jar file is stored. A window should open. Click _File_ -> _Open File..._ and navigate to the extracted STIGViewer-<version.number>.jar file and Open.  
The checklist schema file is located under the schema directory as `U_Checklist_Schema_V#.xsd`. Selecting the file will open it in the right panel. Review the file locating the version number located under `xs:appinfo`. If the version is higher than the 
With the file highlighted, select _File_ then _Save_. Store the file in local directory.


### Resource links

-  The StigViewer jar is located here: https://public.cyber.mil/stigs/srg-stig-tools/
- The jd-gui (Java Decompiler) tool is here: https://mitre.enterprise.slack.com/files/WM4DZRHGD/F04UFGPQ55J/jd-gui-1.6.6.jar
