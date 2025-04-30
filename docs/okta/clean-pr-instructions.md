# Creating a Clean PR for Okta OpenID Client Implementation

These instructions will help you create a clean Pull Request from your existing work by using a fresh copy of the Heimdall2 repository.

## Prerequisites

1. A fresh clone of the Heimdall2 repository
   ```bash
   # Create a new clone in a different directory
   cd ~/github/mitre
   git clone git@github.com:mitre/heimdall2.git heimdall-clean
   ```

2. The migration script (`migrate-okta-pr.sh`) from your working repository

## Step 1: Update the Migration Script Paths

Edit the migration script to point to the correct directories:

1. Copy the script to a location accessible from both repositories
   ```bash
   cp /Users/alippold/github/mitre/heimdall2/migrate-okta-pr.sh ~/migrate-okta-pr.sh
   ```
   
   Note: The script is already in the main Heimdall2 directory, not in apps/backend.

2. Edit the script to update the paths
   ```bash
   vi ~/migrate-okta-pr.sh
   ```

3. Modify these lines at the top of the script:
   ```bash
   # Configuration - MODIFY THESE PATHS
   SOURCE_REPO="/Users/alippold/github/mitre/heimdall2"
   TARGET_REPO="/Users/alippold/github/mitre/heimdall-clean"
   ```

## Step 2: Run the Migration Script

```bash
cd ~/
chmod +x migrate-okta-pr.sh
./migrate-okta-pr.sh
```

The script will:
1. Copy the necessary files from your working repository to the clean one
2. Create a new branch `okta-openid-client-clean` in the clean repository
3. Add and commit the changes with a descriptive message
4. Optionally push the branch and help you create a PR

## Step 3: Review the Changes

Before finalizing, review the changes in the clean repository:

```bash
cd ~/github/mitre/heimdall-clean
git diff master..okta-openid-client-clean
```

## Step 4: Adjust File Locations

After migration, some files need to be moved to their correct locations:

```bash
cd ~/github/mitre/heimdall-clean

# Move environment example file from docs to the root
mv docs/okta/.env.okta.example .env.okta.example

# Ensure e2e test files are in the correct location
# (Adjust if your test directory structure differs)
mkdir -p apps/backend/test/e2e
mv apps/backend/test/okta-auth.e2e-spec.ts apps/backend/test/e2e/ 2>/dev/null || true
```

## Step 5: Test the Implementation

Make sure everything works in the clean repository:

```bash
cd ~/github/mitre/heimdall-clean
yarn install
cd apps/backend
yarn test src/authn
```

## Step 6: Create the Pull Request

If you didn't create the PR through the script:

1. Push the branch:
   ```bash
   git push -u origin okta-openid-client-clean
   ```

2. Go to GitHub and create the PR, using the contents of `okta-pr-summary.md` as your PR description.

## Files Included in the Migration

The migration script will copy these key files:

### Core Implementation Files:
- `apps/backend/src/authn/authn.controller.ts` - Updated controller with better logging
- `apps/backend/src/authn/okta.strategy.ts` - New implementation using openid-client
- `apps/backend/src/authn/okta.strategy.spec.ts` - Updated tests for the new implementation
- `apps/backend/src/filters/authentication-exception.filter.ts` - Enhanced error handling
- `apps/backend/src/filters/authentication-exception.filter.spec.ts` - Updated tests for error handling
- `apps/backend/src/main.ts` - Improved session configuration
- `apps/backend/package.json` - Added openid-client dependency

### Documentation Files (organized in docs/okta/):
- `docs/okta/okta-openid-client-documentation.md` - Main implementation documentation
- `docs/okta/okta-implementation-instructions.md` - Step-by-step implementation guide
- `docs/okta/okta-openid-client-files.txt` - List of all files involved in the implementation
- `docs/okta/okta-pr-summary.md` - PR description (use for GitHub PR description)
- `docs/okta/clean-pr-instructions.md` - Instructions for creating this clean PR