import {AuthenticationExceptionFilter} from './authentication-exception.filter';
import {ArgumentsHost} from '@nestjs/common';
import {v4 as uuidv4} from 'uuid';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-correlation-id')
}));

describe('AuthenticationExceptionFilter', () => {
  let filter: AuthenticationExceptionFilter;
  let mockHost: ArgumentsHost;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    // Create a new filter for each test
    filter = new AuthenticationExceptionFilter('okta');

    // Mock the logger
    jest.spyOn(filter['logger'], 'warn').mockImplementation(() => {});
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => {});
    jest.spyOn(filter['logger'], 'debug').mockImplementation(() => {});

    // Mock the ConfigService
    jest
      .spyOn(filter['configService'], 'isInProductionMode')
      .mockReturnValue(false);

    // Create mock request and response
    mockRequest = {
      method: 'GET',
      url: '/authn/okta/callback',
      headers: {
        'user-agent': 'test-user-agent'
      },
      ip: '127.0.0.1',
      connection: {
        remoteAddress: '127.0.0.1'
      },
      session: {},
      cookies: {},
      query: {}
    };

    mockResponse = {
      redirect: jest.fn(),
      clearCookie: jest.fn(),
      cookie: jest.fn()
    };

    // Create mock ArgumentsHost
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse)
      })
    } as unknown as ArgumentsHost;
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle general authentication errors', () => {
    // Create a generic error
    const error = new Error('Authentication failed');

    // Call the filter
    filter.catch(error, mockHost);

    // Verify logging
    expect(filter['logger'].warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Authentication Error [test-correlation-id]: Authentication failed'
      ),
      expect.any(Object)
    );

    // Verify cookies are set
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'authenticationError',
      expect.stringContaining('Authentication failed'),
      expect.any(Object)
    );
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'errorCorrelationId',
      'test-correlation-id',
      expect.any(Object)
    );

    // Verify redirection
    expect(mockResponse.redirect).toHaveBeenCalledWith(302, '/');
  });

  it('should handle state verification errors and retry authentication', () => {
    // Create a state verification error with authInfo
    const error = new Error('State verification failed');
    mockRequest.authInfo = {
      message: 'Unable to verify authorization request state.'
    };

    // Call the filter
    filter.catch(error, mockHost);

    // Verify logging
    expect(filter['logger'].warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'State verification failed for okta authentication [test-correlation-id]'
      )
    );

    // Verify cookies are cleared
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('connect.sid');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith(
      'authenticationError'
    );
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('errorCorrelationId');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('userID');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');

    // Verify redirection to authentication entry point
    expect(mockResponse.redirect).toHaveBeenCalledWith(302, '/authn/okta');
  });

  it('should provide friendly error messages for common errors', () => {
    // Test timeout error
    const timeoutError = new Error('ETIMEDOUT: Connection timed out');
    filter.catch(timeoutError, mockHost);
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'authenticationError',
      expect.stringContaining('Could not connect to authentication provider'),
      expect.any(Object)
    );

    // Reset mock
    jest.clearAllMocks();

    // Test state error
    const stateError = new Error('Invalid state parameter');
    filter.catch(stateError, mockHost);
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'authenticationError',
      expect.stringContaining('Authentication session error'),
      expect.any(Object)
    );

    // Reset mock
    jest.clearAllMocks();

    // Test validation error
    const validationError = new Error('User validation failed');
    filter.catch(validationError, mockHost);
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'authenticationError',
      expect.stringContaining('Invalid user information received'),
      expect.any(Object)
    );
  });

  it('should clear cookies when handling auth errors with authInfo', () => {
    // Create an error with authInfo
    const error = new Error('Authentication failed');
    mockRequest.authInfo = {
      some: 'info'
    };

    // Call the filter
    filter.catch(error, mockHost);

    // Verify cookies are cleared
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('connect.sid');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith(
      'authenticationError'
    );
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('errorCorrelationId');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('userID');
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');

    // Verify debug logging
    expect(filter['logger'].debug).toHaveBeenCalledWith(
      expect.stringContaining('Authentication context [test-correlation-id]')
    );
  });
});
