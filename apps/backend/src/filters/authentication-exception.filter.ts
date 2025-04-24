import {ArgumentsHost, Catch, ExceptionFilter, Logger} from '@nestjs/common';
import * as _ from 'lodash';
// This import is used at line 17 - ignore false positives from static analysis tools
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {v4 as uuidv4} from 'uuid';
import {ConfigService} from '../config/config.service';

@Catch(Error)
export class AuthenticationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AuthenticationExceptionFilter.name);
  private readonly configService = new ConfigService();

  constructor(readonly authenticationType?: string) {}

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();
    const correlationId = uuidv4();

    // Extract useful information
    const requestInfo = {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      correlationId,
      ip: request.ip ?? request.connection.remoteAddress,
      authType: this.authenticationType ?? 'unknown'
    };

    // Generate detailed error data
    const errorData = {
      message: exception.message,
      stack: exception.stack,
      authInfo: _.get(request, 'authInfo'),
      query: request.query,
      sessionExists: !!request.session,
      cookies: request.cookies,
      correlationId
    };

    // Log the authentication error with correlation ID for traceability
    // Use error level for actual exceptions, warn level for state issues
    if (
      exception.name === 'UnauthorizedException' ||
      exception.message.includes('Authentication failed')
    ) {
      this.logger.warn(
        `Authentication Error [${correlationId}]: ${exception.message}`,
        {
          requestInfo,
          errorData,
          context: 'AuthenticationExceptionFilter.catch'
        }
      );
    } else {
      this.logger.error(
        `Authentication Error [${correlationId}]: ${exception.message}`,
        {
          requestInfo,
          errorData,
          context: 'AuthenticationExceptionFilter.catch',
          stack: exception.stack
        }
      );
    }

    // SECURITY: Handle state verification error - a critical security check for CSRF protection
    // The state parameter is a security mechanism required by the OpenID Connect specification
    // It protects against cross-site request forgery (CSRF) attacks during authentication
    // 
    // How state validation works:
    // 1. During authorization request, a random state value is generated and stored in the session
    // 2. This state is included in the redirect to the identity provider
    // 3. The identity provider returns this state parameter unchanged in the callback
    // 4. The openid-client library compares the returned state with the one stored in session
    // 5. If they don't match, it indicates a potential CSRF attack and this error is thrown
    //
    // This handler specifically catches state validation failures and restarts the authentication flow
    if (
      this.authenticationType &&
      _.get(request, 'authInfo.message') ===
        'Unable to verify authorization request state.'
    ) {
      this.logger.warn(
        `State verification failed for ${this.authenticationType} authentication [${correlationId}]`
      );

      // Clear all auth-related cookies to start with a clean slate
      this.clearAuthCookies(response);

      // Redirect to auth entry point - using 302 (temporary) redirect 
      // to restart the authentication flow with fresh state
      return response.redirect(302, `/authn/${this.authenticationType}`);
    }

    // For other OIDC errors, try to provide a helpful error message
    if (errorData.authInfo && this.authenticationType) {
      // Log context of error to help with debugging
      this.logger.debug(
        `Authentication context [${correlationId}]: ${JSON.stringify(errorData.authInfo)}`
      );

      // Clear cookies to help prevent cascading errors
      this.clearAuthCookies(response);
    }

    // Set an error message cookie - use a specific message based on error type if possible
    let errorMessage = exception.message;

    // Check for common errors and provide friendly messages
    if (
      exception.message.includes('ETIMEDOUT') ||
      exception.message.includes('ECONNREFUSED')
    ) {
      errorMessage = `Could not connect to authentication provider. Please try again later. [${correlationId}]`;
    } else if (exception.message.includes('state')) {
      errorMessage = `Authentication session error. Please try again. [${correlationId}]`;
    } else if (exception.message.includes('validation')) {
      errorMessage = `Invalid user information received. Please contact support. [${correlationId}]`;
    }

    // Set a cookie with the error message
    response.cookie('authenticationError', errorMessage, {
      secure: this.configService.isInProductionMode(),
      httpOnly: false, // Allow JavaScript to access this cookie for frontend error display
      maxAge: 300000 // 5 minutes
    });

    // Set correlation ID cookie for tracking issues
    response.cookie('errorCorrelationId', correlationId, {
      secure: this.configService.isInProductionMode(),
      httpOnly: false,
      maxAge: 300000 // 5 minutes
    });

    // Redirect to home page with 302 (temporary) redirect
    response.redirect(302, '/');
  }

  /**
   * Clears all authentication-related cookies to help resolve state issues
   * @param response - Express response object
   */
  private clearAuthCookies(response: {
    clearCookie: (name: string) => void;
  }): void {
    // Import uuid
    const {v4: uuidv4} = require('uuid');
    const clearingCorrelationId = uuidv4();

    // Clear session cookie
    response.clearCookie('connect.sid');

    // Clear any error or auth cookies
    response.clearCookie('authenticationError');
    response.clearCookie('errorCorrelationId');

    // Clear any other potential cookies related to auth state
    response.clearCookie('userID');
    response.clearCookie('accessToken');

    // Log cookie clearing with context
    this.logger.debug('Cleared authentication cookies', {
      context: 'AuthenticationExceptionFilter.clearAuthCookies',
      authenticationType: this.authenticationType,
      correlationId: clearingCorrelationId
    });
  }
}
