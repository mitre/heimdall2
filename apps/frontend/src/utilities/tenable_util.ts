/* eslint-disable prettier/prettier */
import JSZip from 'jszip';
import axios, {AxiosInstance} from 'axios';
import {ServerModule} from '@/store/server';
import {createWinstonLogger} from '../../../../libs/hdf-converters/src/utils/global';

/** represents the information of the current used */
export interface AuthInfo {
  accesskey: string;
  secretkey: string;
  host_url: string;
}

/** represents the scan results data returned from the /scanResults API endpoint */
export type ScanResults = {
  id: string;
  name: string;
  description?: string;
  details?: string;
  scannedIPs: string;
  totalChecks?: string;
  startTime: string;
  finishTime: string;
  status: string;
};

const UTIL_NAME = 'Tenable.SC';
const LOGIN_TIMEOUT = 30000; // 30 seconds
const LOGIN_TIMEOUT_MSG =
  'Login timed out. Ensure the provided credentials and domain/URL are valid and try again.';
const logger = createWinstonLogger(UTIL_NAME, 'debug');

export class TenableUtil {
  hostConfig: AuthInfo;
  axios_instance: AxiosInstance;
  isServer: boolean = ServerModule.serverMode; // true if Tenable.SC Lite, false if Tenable.SC Enterprise

  constructor(hostConfig: AuthInfo) {
    this.hostConfig = hostConfig;
    const baseURL = this.isServer
      ? ''       // use backend proxy
      : hostConfig.host_url; // talk directly to Tenable

    // If running in the browser (Lite-Mode), set the AUTH and CORS headers
    // Note: Server mode, headers are set by the backend does not require authentication headers
    const headers = this.isServer
      ? {} // backend handles auth
      : {
          'Access-Control-Allow-Origin': '*',
          'x-apikey': `accesskey=${hostConfig.accesskey}; secretkey=${hostConfig.secretkey}`
        };

    this.axios_instance = axios.create(
      {
        withCredentials: true, 
        maxBodyLength: Infinity,
        baseURL,
        headers
      });

    logger.info(
      `Tenable Client initialized in ${this.isServer ? 'Server' : 'Lite'} mode`
    );
  }

  async loginToTenable(): Promise<boolean> {
    logger.info(`Connecting to Tenable Client`);
    return new Promise((resolve, reject) => {
      setTimeout( () => reject(new Error(LOGIN_TIMEOUT_MSG)), LOGIN_TIMEOUT);

      try {
        const url = this.isServer ? '/api/tenable/login' : '/rest/currentUser';
        if (this.isServer) {
          // If running on the server, use the backend proxy endpoint
          logger.info(`Using Server-Mode: ${url}`);
          this.axios_instance
            .post(url, {
              host_url: this.hostConfig.host_url,
              accesskey: this.hostConfig.accesskey,
              secretkey: this.hostConfig.secretkey
            })
            .then((response) => {
              if (response.data.success) {
                resolve(true);
              } else {
                reject(response.data.message);
              }
            })
            .catch((error) => {
              logger.error(
                `Processing (Server-Mode) connection error -> ${error}`
              );
              reject(this.getRejectConnectionMessage(error));
            });
        } else {
          // If running in Lite mode, connect directly to Tenable
          logger.info(`Using Lite-Mode`);
          this.axios_instance
            .get(url)
            .then((response) => {
              if (response.status === 200) {
                logger.info('Processing (Lite-Mode) connected successfully');
                resolve(true);
              } else {
                const msg =
                  response.data?.message ||
                  'Unexpected response structure from Tenable';
                logger.error(
                  `Processing (Lite-Mode) connection failed: ${msg}`
                );
                reject(msg);
              }
            })
            .catch((error) => {
              logger.error(`Processing (Lite-Mode) connecting error: ${error}`);
              reject(this.getRejectConnectionMessage(error));
            });
        }
      } catch (e) {
        reject(`Unknown error: ${e}`);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRejectConnectionMessage(error: any): string {
    let rejectMsg = '';
    const TENABLE_HOST_URL = ServerModule.tenableHostUrl;
    const TENABLE_CSP_NOT_SET =
      'The Content Security Policy directive environment variable "TENABLE_HOST_URL" is not configured. See Help for additional instructions.';
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.data.error_code == 74 || error.status === 403) {
        rejectMsg = 'Incorrect Access or Secret key provided. Please check your credentials.';
      } else if (error.code == 'ERR_BAD_REQUEST') {
        if (error.status == 400) {
          // If the error code is 400, it means the request was malformed
          // If we are a server and the response data message is set (was set by the backend),
          // we can assume the request was malformed due to Content Security Policy (CSP) violation
          // and we can display a more user-friendly error message. Otherwise, we display the error
          // message as is (e.g. the server is not reachable, the request is not allowed, etc)
          if (this.isServer && error.response?.data?.message) {
            rejectMsg = this.getCSPErrorMsg(this.hostConfig.host_url, TENABLE_HOST_URL)
          } else {
            rejectMsg = 'Malformed Request: ' + (error.response?.data?.message ?? error.message);         
          }
        } else if (error.status == 401) {
          // If the error code is 401, it means the request was unauthorized
          rejectMsg =
            'Unauthorized (missing or not accepted credentials): ' +
            (error.response?.data?.message ?? error.message);
        } else if (error.status == 404) {
          if (this.isServer && !TENABLE_HOST_URL) {
            rejectMsg = TENABLE_CSP_NOT_SET;
          } else {
            rejectMsg = `Network Error -> 
              ${error.name}: ${(error.response?.data?.message ?? error.message)}, 
              ${error.response?.data?.code ?? error.code}`;          
          }
        } else if (error.status == 408) {
          // If the error code is 408, it means the request timed out
          rejectMsg = `Request Timeout -> 
          ${error.name}: ${(error.response?.data?.message ?? error.message)}, 
          ${error.response?.data?.code ?? error.code}`;
        } else {
          // If the error code is not 400, 401, 404 or 408, it means the request was
          // rejected by the server for some other reason
          // (e.g. the server is not reachable, the request is not allowed, etc
          rejectMsg = `Request Rejected (bad request) -> 
            ${error.name}: ${(error.response?.data?.message ?? error.message)}, 
            ${error.response?.data?.code ?? error.code}`;
        }
      } else if (error.code == `ERR_BAD_RESPONSE`) {
        if (error.status == 502) {
          rejectMsg = error.response?.data?.message ??
            'Response Error (SSL) -> Certificate verification failed. '+
            'Possible untrusted or incomplete TLS certificate chain.';
        } else {
          rejectMsg = `Response Error (bad request) -> 
            ${error.name}: ${(error.response?.data?.message ?? error.message)}, 
            ${error.response?.data?.code ?? error.code}`;
        }
      } else {
        // If the error message was not a 'ERR_BAD_REQUEST', it means the request was rejected
        // by the server for some other reason
        rejectMsg = `Response Error -> 
          ${error.name}: ${(error.response?.data?.message ?? error.message)}, 
          ${error.response?.data?.code ?? error.code}`;
      }
    } else if (error.request) {
      // The request was made but no response was received.
      // `error.request` is an instance of XMLHttpRequest in the
      // browser and an instance of http.ClientRequest in node.js

      if (error.code == 'ERR_NETWORK') {
        // Check if the tenable url was provided - Content Security Policy (CSP)
        const corsReject = `Possible access blocked by CORS or connection refused by the host: ${error.config.baseURL}. See Help for additional instructions. Received Error: ${error.message}`;
        if (TENABLE_HOST_URL) {
          // If the URL is listed in the allows domains
          // (.env variable TENABLE_HOST_URL) check if they match
          if (!error.config.baseURL.includes(TENABLE_HOST_URL)) {
            if (error.config.baseURL) {
              rejectMsg = this.getCSPErrorMsg(error.config.baseURL, TENABLE_HOST_URL)
            } else {
              // we assume that the connection was rejected, most likely is that the network path does not exist
              rejectMsg = 'Connection refused by host, or broken network path'
            }
          } else {
            // CSP url did match, check for port match - reject appropriately
            const portNumber = parseInt(this.hostConfig.host_url.split(':')[2]);
            if (portNumber != 443) {
              rejectMsg = `Invalid SSL/TSL port number used: ${portNumber} must be 443.`;
            } else {
              rejectMsg = corsReject;
            }
          }
        } else if (ServerModule.serverMode) {
          // The URL is not listed in the allows domains (CSP) and Heimdall instance is a server
          rejectMsg = TENABLE_CSP_NOT_SET;
        } else {
          rejectMsg = corsReject;
        }
      } else if (error.code == 'ENOTFOUND') {
        rejectMsg = `Host: ${error.config.baseURL} not found, check the Hostname (URL) or the network.`;
      } else if (error.code == 'ERR_CONNECTION_REFUSED') {
        rejectMsg = `Received network connection refused by the host: ${error.config.baseURL}`;
      } else {
        rejectMsg = `Request Error->
          ${error.name}: ${(error.response?.data?.message ?? error.message)}, 
          ${error.response?.data?.code ?? error.code}`;
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      rejectMsg = `Unknown Error-> 
        ${error.name}: ${(error.response?.data?.message ?? error.message)}, 
        ${error.response?.data?.code ?? error.code}`;
    }
    return rejectMsg;
  }

  /**
   * Gets the list of Scan Results.
   * Returned values are based on the fields requested:
   *   name,description,scannedIPs,startTime,finishTime,status
   */
  async getScans(startTime: number, endTime: number): Promise<[]> {
    logger.info(`Getting scans from Tenable Client`);
    return new Promise((resolve, reject) => {
      setTimeout( () => reject(new Error(LOGIN_TIMEOUT_MSG)), LOGIN_TIMEOUT);

      try {
        const url = this.buildTenableUrl(
          `/rest/scanResult?fields=name,description,details,scannedIPs,totalChecks,startTime,finishTime,status&startTime=${startTime}&endTime=${endTime}`,
          this.isServer
        );

        this.axios_instance
          .get(url)
          .then((response) => {
            resolve(response.data.response.usable);
          })
          .catch((error) => {
            reject(this.getRejectMessage(error));
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Downloads the Scan Result associated with {id}.
   * NOTE: A Scan Result of the requested downloadType must exist for the target Scan Result.
   * The response is a downloaded file for the requested type:
   *   For type "v2", the file is a Nessus file or a zip file containing a Nessus file.
   *   For types "oval" and "scap1_2", the file is a zip file containing the oval or scap results.
   *   For type "diagnostic", the file is a diagnostic database file.
   */
  async getVulnerabilities(scanId: string): Promise<string> {
    logger.info(`Getting vulnerabilities from Tenable Client`);
    return new Promise((resolve, reject) => {
      setTimeout( () => reject(new Error(LOGIN_TIMEOUT_MSG)), LOGIN_TIMEOUT);

      try {
        const url = this.buildTenableUrl(
          `/rest/scanResult/${scanId}/download?downloadType=v2`,
          this.isServer
        );

        this.axios_instance
          .post(url, {}, {responseType: 'arraybuffer', headers: {'Content-Type': 'application/zip'}})
          .then(async (response) => {
            // Unzip response in memory
            try {
              // Convert arraybuffer response to a JSZip instance
              const zip = await JSZip.loadAsync(response.data);

              // Get a list of file names inside the ZIP archive
              const fileNames = Object.keys(zip.files);
              if (fileNames.length === 0) {
                return reject(new Error('ZIP file is empty.'));
              }

              // Access the first file in the archive
              const firstFile = zip.files[fileNames[0]];

              // Read its contents as text
              const text = await firstFile.async('text');

              resolve(text);
            } catch (unzipErr) {
              reject(unzipErr);
            }
          })
          .catch((error) => {
            reject(this.getRejectMessage(error));
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRejectMessage(error: any): string {
    let rejectMsg = '';
    if (error.code == 'ERR_BAD_REQUEST') {
      if (error.status == 401) {
        rejectMsg = 'Not authenticated with Tenable or CSP not set';
      } else if (error.status == 403) { 
        // If the error code is 403, it means the request was forbidden
        rejectMsg = 'Failed to download scan, this could be due to a bad scan';
      } else {
        rejectMsg = `Response Error ->
          ${error.name}: ${(error.response?.data?.message ?? error.message)}, 
          ${error.response?.data?.code ?? error.code}`; 
      }
    } else {
      // If the error message was not a 'ERR_BAD_REQUEST', it means the request was rejected
      // by the server for some other reason
      rejectMsg = `Response Error -> 
        ${error.name}: ${(error.response?.data?.message ?? error.message)}, 
        ${error.response?.data?.code ?? error.code}`; 
    }
    return rejectMsg;
  }

  /**
   * Constructs a Tenable API URL based on the execution context.
   * Ensure the path always starts with a leading slash
   *
   * @param path - The endpoint path to append to the base URL.
   * @param isServer - Indicates if the code is running on the server.
   *   - If `true`, prefixes the path with `/api/tenable` for server-side requests.
   *   - If `false`, returns the path as-is for client-side requests.
   * @returns The constructed URL string for the Tenable API.
   */
  buildTenableUrl(path: string, isServer: boolean) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return isServer ? `/api/tenable${path}` : normalizedPath;
  }

  /**
   * Generates an error message indicating a Content Security Policy (CSP) violation.
   *
   * @param baseURL - The hostname that triggered the CSP violation.
   * @param tenableUrl - The hostname allowed by the CSP.
   * @returns A string describing the CSP violation, including the offending and allowed hostnames.
   */
  getCSPErrorMsg(baseURL: string, tenableUrl: string): string {
    return `Hostname: ${baseURL?.trim() || 'Unknown host'} violates the Content Security Policy (CSP). The host allowed by the CSP is: ${tenableUrl?.trim() || 'Host not set'}`;
  }

}
