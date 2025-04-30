# Okta OpenID-client Implementation Transfer Instructions

This document provides instructions for transferring the Okta OpenID-client implementation to a clean branch of the Heimdall repository.

## Files Overview

The implementation consists of these key files:

1. **Primary Implementation Files:**
   - `src/authn/okta.strategy.ts` - The core Okta strategy using openid-client
   - `src/authn/okta.strategy.spec.ts` - Tests for the Okta strategy
   - `src/authn/authn.module.ts` - Updated authentication module including Okta strategy
   - `src/authn/authn.controller.ts` - Controller with Okta authentication endpoints
   - `src/authn/oidc.strategy.ts` - Supporting OIDC strategy

2. **Supporting Changes:**
   - `package.json` - Added openid-client v6.4.2 dependency
   - `src/config/config.service.ts` - Configuration service with Okta support
   - `src/config/dto/startup-settings.dto.ts` - DTO with OIDC settings
   - `src/filters/authentication-exception.filter.ts` - Error handling for authentication
   - `src/filters/authentication-exception.filter.spec.ts` - Tests for error handling

3. **Documentation:**
   - `okta-openid-client-documentation.md` - Comprehensive documentation of the implementation

## Transfer Instructions

### Method 1: Using the Extraction Script

1. **Copy the extraction script to your machine:**
   ```bash
   # Save extract-okta-implementation.sh to your machine
   chmod +x extract-okta-implementation.sh
   ```

2. **Run the script from your clean repository:**
   ```bash
   cd /path/to/clean/heimdall2/repo
   /path/to/extract-okta-implementation.sh
   ```

3. **Review and apply the extracted files:**
   ```bash
   # Review the extracted files
   ls -la extracted_okta_implementation/
   
   # Apply the files to your repository
   cp -R extracted_okta_implementation/* .
   ```

4. **Install the openid-client dependency:**
   ```bash
   cd apps/backend
   yarn add openid-client@6.4.2
   ```

5. **Create a new branch and commit the changes:**
   ```bash
   git checkout -b feature/okta-openid-implementation
   git add .
   git commit -m "Add Okta OpenID-client implementation"
   ```

### Method 2: Manual Transfer

1. **Create a new branch in your clean repository:**
   ```bash
   cd /path/to/clean/heimdall2/repo
   git checkout -b feature/okta-openid-implementation
   ```

2. **Create necessary directories if they don't exist:**
   ```bash
   mkdir -p apps/backend/src/authn
   mkdir -p apps/backend/src/config/dto
   mkdir -p apps/backend/src/filters
   ```

3. **Copy all files from the list in `okta-openid-client-files.txt`**

4. **Add the openid-client dependency:**
   ```bash
   cd apps/backend
   yarn add openid-client@6.4.2
   ```

5. **Commit the changes:**
   ```bash
   git add .
   git commit -m "Add Okta OpenID-client implementation"
   ```

## Required Environment Variables

To use the Okta authentication, you'll need to set these environment variables:

```
OKTA_DOMAIN=your-domain.okta.com
OKTA_CLIENTID=your-client-id
OKTA_CLIENTSECRET=your-client-secret
EXTERNAL_URL=your-app-url
```

## Testing

To test the implementation:

1. **Run unit tests:**
   ```bash
   cd apps/backend
   yarn test src/authn/okta.strategy.spec.ts
   yarn test src/filters/authentication-exception.filter.spec.ts
   ```

2. **Functional testing:**
   - Configure the environment variables
   - Start the application
   - Attempt to authenticate with Okta

## Documentation

Refer to `okta-openid-client-documentation.md` for comprehensive documentation of the implementation, including:
- Technical details
- Testing approach
- Best practices
- References and resources