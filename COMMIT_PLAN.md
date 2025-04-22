# PR Commit Plan

This document outlines the planned commits to organize our authentication logging enhancements PR.

## Commit Structure

1. **Initial Setup and Documentation**
   ```
   docs: add authentication logging enhancement documentation
   
   - Create auth-logging-enhancement-summary.md
   - Update DEVELOPMENT.md with logging information
   - Add correlation ID documentation
   ```

2. **Core Logging Improvements**
   ```
   feat: add centralized logger with correlation IDs
   
   - Create unified logger utility
   - Add correlation ID generation
   - Implement structured logging format
   - Add proper sanitization for sensitive data
   ```

3. **Authentication Strategy Enhancements**
   ```
   feat: enhance authentication strategies with logging
   
   - Add correlation ID tracking to all strategies
   - Implement performance metrics
   - Standardize event naming
   - Add detailed context for troubleshooting
   ```

4. **Authentication Exception Handling**
   ```
   feat: improve authentication exception filter
   
   - Add strategy-specific error handling
   - Implement correlation ID tracking for errors
   - Add error categorization
   - Fix redirect status codes (302 instead of 301)
   ```

5. **Fix OIDC/Okta Scope Configuration**
   ```
   fix: remove redundant openid scope from OIDC strategies
   
   - Update OIDC and Okta strategies to avoid scope duplication
   - Document library behavior in authentication-enhancement-summary.md
   ```

6. **State Verification and Cookie Handling**
   ```
   feat: enhance state verification and cookie handling in authentication
   
   - Add detection for character encoding issues
   - Implement retry counting to prevent infinite loops
   - Add aggressive cookie clearing
   - Improve error messages for state verification failures
   ```

7. **Security Enhancements**
   ```
   feat: add security-focused authentication logging
   
   - Implement authentication failure categorization
   - Add client IP tracking
   - Add suspicious activity detection
   - Enhance header sanitization
   ```

8. **Test Updates**
   ```
   test: update authentication tests for enhanced logging
   
   - Add authentication exception filter tests
   - Update strategy tests to validate logging
   - Add tests for character encoding issues
   - Add tests for correlation ID integration
   ```

## Review Process

1. Before finalizing commits:
   - Remove any debug code or console.log statements
   - Check for TODO comments and resolve or convert to issues
   - Ensure consistent log message formats
   - Verify all tests pass

2. After organizing commits:
   - Verify PR description matches the commit structure
   - Update auth-logging-enhancement-summary.md if needed
   - Create issues for deferred items