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
