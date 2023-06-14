import axios, {AxiosResponse} from 'axios';
import _ from 'lodash';
import {SplunkConfig} from '../../types/splunk-config-types';

// Helper function to generate a parseable hostname for HTTP requests
export function generateHostname(config: SplunkConfig): string {
  return config.port
    ? `${config.scheme}://${config.host}:${config.port}`
    : `${config.scheme}://${config.host}:8089`;
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
  setTimeout(() => {
    throw new Error(
      'Login timed out: Please check your CORS configuration or validate that you have inputted the correct domain'
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
    // Parse through valid Splunk HTTP errors and report failed request cause
    // Per https://docs.splunk.com/Documentation/Splunk/latest/RESTUM/RESTusing#HTTP_Status_Codes
    switch (_.get(error, ['response', 'status'])) {
      case 400:
        throw new Error('Malformed request received');
      case 401:
        throw new Error('Incorrect username or password');
      case 402:
        throw new Error('Bad license detected');
      case 403:
        throw new Error('Insufficient permission for this request');
      case 404:
        throw new Error('Targeted endpoint does not exist');
      case 409:
        throw new Error('Invalid request operation made on endpoint');
      case 500:
        throw new Error('Internal server error');
      case 503:
        throw new Error('This feature is disabled by server configurations');
      default:
        throw new Error(
          'Failed to login: Please check your CORS configuration and validate that your input has the correct domain'
        );
    }
  }

  // If successful, return session key found in response body
  if (_.has(authRequest, ['data', 'sessionKey'])) {
    return authRequest.data.sessionKey;
  } else {
    throw new Error(
      'Failed to login: Malformed authentication response received'
    );
  }
}
