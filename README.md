# InSpecJS

To update schemas install `quicktype` with `npm install -g quicktype` and use `npm run gen-types`

### Local Testing

In order to test your inspecjs changes in another application (for example Heimdall), perform the following steps:

1. Make your changes
2. Run `npm build`
3. In the repository you would like to test your inspecjs changes against, run `npm link path/to/inspecjs`
4. Any subsequent changes to inspecjs will require an `npm build` in inspecjs, but not a re-link

### Creating a Release

**Note:** This action requires appropriate privileges on the repository to perform.

1. Ensure you have pulled the latest copy of the code locally onto your machine.
1. Using `npm version`, run `npm version <explicit version>` or alternatively use one of the appropriate npm keywords: `'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'` to bump the version. This will push a new tag to Github.
1. Navigate to `Releases` on Github and edit the release notes that `Release Drafter` has created for you, and assign them to the tag that you just pushed.

### NOTICE

This software is currently in EARLY ALPHA DEVELOPMENT. No guarantees whatsoever are made to its safety, reliability, or accuracy with regards to the parsing and analyzing of inspec files. Do NOT use in production, and do NOT expect current API to remain stable. Use at your own risk.

### NOTICE

© 2018 The MITRE Corporation.

Approved for Public Release; Distribution Unlimited. Case Number 18-3678.

### NOTICE

MITRE hereby grants express written permission to use, reproduce, distribute, modify, and otherwise leverage this software to the extent permitted by the licensed terms provided in the LICENSE.md file included with this project.

### NOTICE

This software was produced for the U. S. Government under Contract Number HHSM-500-2012-00008I, and is subject to Federal Acquisition Regulation Clause 52.227-14, Rights in Data-General.

No other use other than that granted to the U. S. Government, or to those acting on behalf of the U. S. Government under that Clause is authorized without the express written permission of The MITRE Corporation.

For further information, please contact The MITRE Corporation, Contracts Management Office, 7515 Colshire Drive, McLean, VA  22102-7539, (703) 983-6000.
