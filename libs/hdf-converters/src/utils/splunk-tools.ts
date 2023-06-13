import axios from 'axios';
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

  return new Promise((resolve, reject) => {
    // Time to wait (in ms) for login query response until returning bad query status
    // Arbitrary, change as necessary
    const loginTimeout = 5000;

    setTimeout(
      () =>
        reject(
          'Login timed out: Please check your CORS configuration or validate that you have inputted the correct domain'
        ),
      loginTimeout
    );
    axios
      .post(
        `${hostname}/services/auth/login`,
        new URLSearchParams({
          username: username,
          password: password
        }),
        {params: {output_mode: 'json'}}
      )
      .then(
        (response) => resolve(response.data.sessionKey),
        (error) => {
          try {
            if (error.response.status === 401) {
              reject('Incorrect Username or Password');
            }
          } catch (error) {
            reject(
              'Failed to login: Please check your CORS configuration and validate that your input has the correct domain'
            );
          }
        }
      );
  });
}
