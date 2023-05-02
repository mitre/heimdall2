import Zip from 'adm-zip';
import axios, {AxiosInstance} from 'axios';
import https from 'https';
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
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
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
              'Login timed out. Please check your CORS configuration or validate you have inputted the correct domain'
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
            try {
              if (error.code == 'ENOTFOUND') {
                reject(
                  `Host: ${this.hostConfig.host_url} not found, check the Host Name (URL) or the network`
                );
              } else if (error.response.data.error_code == 74) {
                reject('Incorrect Access or Secret key');
              } else {
                reject(error.response.data.error_msg);
              }
            } catch (e) {
              reject(`Network connection error ${error}`);
            }
          });
      } catch (e) {
        reject(`Unknown error: ${e}`);
      }
    });
  }

  /**
   * Gets the list of Scan Results.
   * Returned values are based on the fields requested:
   *   name,description,scannedIPs,startTime,finishTime,status
   */
  async getScans(): Promise<[]> {
    logger.info(`Getting scans from Tenable Client`);
    return new Promise((resolve, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(
              'Login timed out. Please check your CORS configuration or validate you have inputted the correct domain'
            )
          ),
        5000
      );

      try {
        this.axios_instance({
          method: 'get',
          url: '/rest/scanResult?fields=name,description,scannedIPs,totalChecks,startTime,finishTime,status'
        })
          .then((response) => {
            resolve(response.data.response.usable);
          })
          .catch((error) => {
            if (error.response.data.error_code == 74) {
              reject('Incorrect Access or Secret key');
            } else {
              reject(error.response.data.error_msg);
            }
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
              'Login timed out. Please check your CORS configuration or validate you have inputted the correct domain'
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
