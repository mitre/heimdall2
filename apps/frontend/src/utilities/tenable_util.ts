import Zip from 'adm-zip';
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
const logger = createWinstonLogger(UTIL_NAME, 'debug');

export class TenableUtil {
  hostConfig: AuthInfo;
  axios_instance: AxiosInstance;

  constructor(hostConfig: AuthInfo) {
    this.hostConfig = hostConfig;
    this.axios_instance = axios.create({
      maxBodyLength: Infinity,
      baseURL: hostConfig.host_url,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'x-apikey': `accesskey=${hostConfig.accesskey}; secretkey=${hostConfig.secretkey}`
      }
    });
    logger.info(`Initializing Tenable Client`);
  }

  async loginToTenable(): Promise<boolean> {
    logger.info(`Connecting to Tenable Client`);
    return new Promise((resolve, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              'Login timed out. Please ensure the provided credentials and domain/URL are valid and try again.'
            )
          ),
        5000
      );

      try {
        this.axios_instance({
          method: 'get',
          url: '/rest/currentUser'
        })
          .then((response) => {
            resolve(response.request.finished);
          })
          .catch((error) => {
            reject(this.getRejectConnectionMessage(error));
          });
      } catch (e) {
        reject(`Unknown error: ${e}`);
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRejectConnectionMessage(error: any): string {
    let rejectMsg = '';

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx

      if (error.response.data.error_code == 74) {
        rejectMsg = 'Incorrect Access or Secret key';
      } else {
        rejectMsg = `${error.name} : ${error.response.data.error_msg}`;
      }
    } else if (error.request) {
      // The request was made but no response was received.
      // `error.request` is an instance of XMLHttpRequest in the
      // browser and an instance of http.ClientRequest in node.js

      if (error.code == 'ERR_NETWORK') {
        // Check if the tenable url was provided - Content Security Policy (CSP)
        const tenableUrl = ServerModule.tenableHostUrl;
        if (tenableUrl) {
          // If the URL is listed in the allows domains
          // (.env variable TENABLE_HOST_URL) check if they match
          if (!error.config.baseURL.includes(tenableUrl)) {
            rejectMsg = `Hostname: ${error.config.baseURL} violates the Content Security Policy (CSP). The host allowed by the CSP is: ${tenableUrl}`;
          } else {
            // CSP url didn't match, check for port match - reject appropriately
            const portNumber = parseInt(this.hostConfig.host_url.split(':')[2]);
            if (portNumber != 443) {
              rejectMsg = `Invalid SSL/TSL port number used: ${portNumber} must be 443.`;
            } else {
              rejectMsg =
                'Access blocked by CORS, enable CORS on the browser and try again. See Help for additional instructions.';
            }
          }
        } else if (ServerModule.serverMode) {
          // The URL is not listed in the allows domains (CSP) and Heimdall instance is a server
          rejectMsg =
            'The Content Security Policy directive environment variable "TENABLE_HOST_URL" not configured. See Help for additional instructions.';
        } else {
          rejectMsg =
            'Access blocked by CORS, enable CORS on the browser and try again. See Help for additional instructions.';
        }
      } else if (error.code == 'ENOTFOUND') {
        rejectMsg = `Host: ${error.config.baseURL} not found, check the Hostname (URL) or the network.`;
      } else {
        rejectMsg = `${error.name} : ${error.message}`;
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      rejectMsg = `${error.name} : ${error.message}`;
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
      setTimeout(
        () =>
          reject(
            new Error(
              'Login timed out. Please ensure the provided credentials and domain/URL are valid and try again.'
            )
          ),
        5000
      );

      try {
        this.axios_instance({
          method: 'get',
          url: `/rest/scanResult?fields=name,description,details,scannedIPs,totalChecks,startTime,finishTime,status&startTime=${startTime}&endTime=${endTime}`
        })
          .then((response) => {
            resolve(response.data.response.usable);
          })
          .catch((error) => {
            reject(`${error.name} : ${error.message}`);
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
      setTimeout(
        () =>
          reject(
            new Error(
              'Login timed out. Please check your CORS configuration and validate that the hostname is correct.'
            )
          ),
        5000
      );

      try {
        this.axios_instance({
          method: 'post',
          url: `rest/scanResult/${scanId}/download?downloadType=v2`,
          responseType: 'arraybuffer'
        })
          .then((response) => {
            // Unzip response in memory
            try {
              const zip = new Zip(Buffer.from(response.data));
              const zipEntries = zip.getEntries();
              resolve(zip.readAsText(zipEntries[0]));
            } catch (unzipErr) {
              reject(unzipErr);
            }
          })
          .catch((error) => {
            reject(error);
          });
      } catch (e) {
        reject(e);
      }
    });
  }
}
