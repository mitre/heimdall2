import axios, {AxiosResponse} from 'axios';
import * as _ from 'lodash';
import {SplunkConfig} from '../../types/splunk-config-types';

// Helper function to generate a parseable hostname for HTTP requests
export function generateHostname(config: SplunkConfig): string {
  return config.port
    ? `${config.scheme}://${config.host}:${config.port}`
    : `${config.scheme}://${config.host}:8089`;
}

// Parse through valid Splunk HTTP errors and report failed request cause
// Per https://docs.splunk.com/Documentation/Splunk/latest/RESTUM/RESTusing#HTTP_Status_Codes
export function handleSplunkErrorResponse(error: AxiosResponse): string {
  switch (_.get(error, ['response', 'status'])) {
    case 400:
      return 'Malformed request received';
    case 401:
      return 'Incorrect username or password';
    case 402:
      return 'Bad license detected';
    case 403:
      return 'Insufficient permission for this request';
    case 404:
      return 'Targeted endpoint does not exist';
    case 409:
      return 'Invalid request operation made on endpoint';
    case 500:
      return 'Internal server error';
    case 503:
      return 'This feature is disabled by server configurations';
    default:
      return `Unexpected error`;
  }
}

// Returns a string typed session key for any given valid set of credentials
export async function checkSplunkCredentials(
  config: SplunkConfig
): Promise<string> {
  const hostname = generateHostname(config);
  const username = (config.username ??= '');
  const password = (config.password ??= '');
  let authRequest: AxiosResponse;

  // Time to wait (in ms) for login query response until returning bad query status
  // Arbitrary, change as necessary
  const loginTimeout = 5000;

  // Fail query if request takes too long to respond
  const loginTimer = setTimeout(() => {
    throw new Error(
      'Login timed out - Please check your CORS configuration or validate that you have inputted the correct domain'
    );
  }, loginTimeout);

  // Try authenticating to Splunk with given credentials
  try {
    authRequest = await axios.post(
      `${hostname}/services/auth/login`,
      new URLSearchParams({
        username: username,
        password: password
      }),
      {params: {output_mode: 'json'}}
    );
  } catch (error) {
    // Kill timer since request has failed
    clearTimeout(loginTimer);

    console.log(`Splunk axios error: ${error}`);

    // Parse error response and report why request failed
    const errorCode = handleSplunkErrorResponse(error);
    if (errorCode === 'Unexpected error') {
      throw new Error(
        `Failed to login - Please check your CORS configuration and validate that your input has the correct domain: ${error}`
      );
    } else {
      throw new Error(`Failed to login - ${errorCode}`);
    }
  }

  // Kill timer since request has passed
  clearTimeout(loginTimer);

  // If successful, return session key found in response body
  if (_.has(authRequest, ['data', 'sessionKey'])) {
    return authRequest.data.sessionKey;
  } else {
    throw new Error(
      'Failed to login - Malformed authentication response received'
    );
  }
}
