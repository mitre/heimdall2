// This is where we connect to tenable
import axios from 'axios';
import https from 'https';
import {ZipFile} from 'yazl';
import {Logger} from 'winston';
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
  startTime: string;
  finishTime: string;
  status: string;
};

const UTIL_NAME = 'Tenable.SC';
const logger =createWinstonLogger(UTIL_NAME, 'debug');

export class TenableUtil {
  
  hostConfig: AuthInfo;

  axios_instance: any;

  constructor(hostConfig: AuthInfo, loggingLevel?: string) {
    this.hostConfig = hostConfig;
    this.axios_instance = axios.create({
      maxBodyLength: Infinity,
      //url: `${hostConfig.host_url}/rest/currentUser`,
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
        .then((response: any) => {
          resolve(response.request.finished);
        })
        .catch((error: any) => {
          try {
            if (error.code == 'ENOTFOUND') {
              reject(`Host: ${this.hostConfig.host_url} not found, check the Host Name (URL) or the network`)
            } else if (error.response.data.error_code == 74) {
              reject('Incorrect Access or Secret key');
            } else {
              reject(error.response.data.error_msg)
            }
          } catch (e) {
            reject(`Network connection error ${error}`)
          }        
        });
      } catch (e) {
        reject(`Unknown error: ${e}`)
      }
    });
  }

  async getScans(): Promise<any[]> {
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
          url: '/rest/scanResult?fields=name,description,scannedIPs,startTime,finishTime,status'
        })
        .then((response: any) => {
          resolve(response.data.response.usable);
        })
        .catch((error: any) => {
          if (error.response.data.error_code == 74) {
            reject('Incorrect Access or Secret key');
          } else {
            reject(error.response.data.error_msg)
          }
        });
      } catch (e) {
        reject(e)
      }
    });
  }

  /**
   * Requests to the analysis API include three items:
   * 1 - Data Type & Source—The type of data being exported (cumulative data, individual scans, mobile data, etc.).
   *     The most commonly used values are as follows:
   *      * Type 
   *          vuln—For vulnerability and compliance findings.
   *      * SourceTypes 
   *          cumulative—For current active vulnerability data (stateful).
   *          patched—For fixed or remediated vulnerability data (stateful).
   *          individual—For singular scan results (not stateful).
   *  2 - Visibility Tool — Determines how the data should be summarized (if at all).
   *      The tool informs Tenable.sc what level of summarization you want from the data.
   *      Typically, for most data exports, you should avoid summarization and opt for raw data.
   *      Tenable recommends using the `vulndetails` tool for the majority of cases.
   *  3 - Filters—Determines the subset of the information to include in the export. 
   *      Recommendation of fetching a predetermined filter set from the query API are:
   *          lastSeen (temporal, source: cumulative_) 
   *             — Filters the results by the last time a scan observed the vulnerability.
   *          lastMitigated (temporal, source:patched)
   *             — Filters the results by the time in which a vulnerability was observed
   *               as fixed, patched, or remediated.
   */
  async getVulnerabilities(scanId: string): Promise<any[]> {
    // let config = {
    //   method: 'post',
    //   maxBodyLength: Infinity,
    //   url: 'https://vcapsecb1.mitre.org:443/rest/scanResult/9210/download?downloadType=v2',
    //   headers: { 
    //     'x-apikey': 'accesskey=0fa926a493ec4e1c8a4ffc2e1bb9d7fb; secretkey=c78972f44aef48b1992a2a8ad6cfb6a5', 
    //     'Cookie': 'TNS_SESSIONID=932ed0a6200b194114c15832a079b310'
    //   }
    // };
    
    // axios.request(config)
    // .then((response) => {
    //   console.log(JSON.stringify(response.data));
    // })
    // .catch((error) => {
    //   console.log(error);
    // });
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
          url: `rest/scanResult/${scanId}/download?downloadType=v2`
        })
        .then((response: any) => {
          logger.debug(`We got data ${response}`);
          // Unzip into an js object
          const zipfile = new ZipFile();
          zipfile.addReadStream(process.stdin,response.data);
          
          //   if (err) throw err;
          //   readStream.on("end", function() {
          //     zipfile.readEntry();
          //   });
          //   readStream.pipe(somewhere);
          // });

          console.log('zipfile is: ', zipfile.outputStream)
          resolve(response.data);
        })
        .catch((error: any) => {
          // if (error.response.data.error_code == 74) {
          //   reject('Incorrect Access or Secret key');
          // } else {
          //   reject(error.response.data.error_msg)
          // }
          reject(error)
        });
      } catch (e) {
        reject(e)
      }
    });
  }
}
// export async function loginToTenable(
//   hostConfig: AuthInfo
// ): Promise<boolean> {

//   const axios_instance = axios.create({
//     method: 'get',
//     maxBodyLength: Infinity,
//     //url: `${hostConfig.host_url}/rest/currentUser`,
//     baseURL: hostConfig.host_url,
//     headers: {
//       'x-apikey': `accesskey=${hostConfig.accesskey}; secretkey=${hostConfig.secretkey}`
//     },
//     httpsAgent: new https.Agent({
//       rejectUnauthorized: false
//     })
//   });

//   //console.log("HERE- tenable_util config is: ", JSON.stringify(config))
//   return new Promise((resolve, reject) => {
//     setTimeout(
//       () =>
//         reject(
//           new Error(
//             'Login timed out WHAT. Please check your CORS configuration or validate you have inputted the correct domain'
//           )
//         ),
//       5000
//     );

//     try {
//       //const axiosClient = axios.create()
//       axios_instance({
//         method: 'get',
//         url: '/rest/currentUser'
//       })
//       .then((response) => {
//         //console.log(JSON.stringify(response.data));
//         resolve(response.request.finished);
//       })
//       // .catch((error) => {
//       //   if (error.response.data.error_code == 74) {
//       //     reject('Incorrect Access or Secret key');
//       //   } else {
//       //     reject(`HERE 1 ${error.response.data.error_msg}`)
//       //   }
//       // });
//       .catch((error) => {
//         try {
//           if (error.code == 'ENOTFOUND') {
//             reject(`Host: ${hostConfig.host_url} not found, check the Host Name (URL) or the network`)
//           } else if (error.response.data.error_code == 74) {
//             reject('Incorrect Access or Secret key');
//           } else {
//             reject(error.response.data.error_msg)
//           }
//         } catch (e) {
//           reject(`Network connection error ${error}`)
//         }        
//       });
//     } catch (e) {
//       reject(`Unknown error: ${e}`)
//     }
//   });
// }

// export async function getScans(
//   hostConfig: AuthInfo
//   ): Promise<any[]> {

//   const config = {
//     method: 'get',
//     maxBodyLength: Infinity,
//     url: `${hostConfig.host_url}/rest/scanResult?fields=name,description,scannedIPs,startTime,finishTime,status`,
//     headers: { 
//       'x-apikey': `accesskey=${hostConfig.accesskey}; secretkey=${hostConfig.secretkey}`
//     },
//     httpsAgent: new https.Agent({
//       rejectUnauthorized: false
//     })
//   };
//   console.log("HERE- tenable_util.getScans config is: ", JSON.stringify(config))
//   return new Promise((resolve, reject) => {
//     setTimeout(
//       () =>
//         reject(
//           new Error(
//             'Login timed out. Please check your CORS configuration or validate you have inputted the correct domain'
//           )
//         ),
//       5000
//     );
    
//     try {
//       axios.request(config)
//       .then((response) => {
//         resolve(response.data.response.usable);
//       })
//       .catch((error) => {
//         if (error.response.data.error_code == 74) {
//           reject('Incorrect Access or Secret key');
//         } else {
//           reject(error.response.data.error_msg)
//         }
//       });
//     } catch (e) {
//       reject(e)
//     }
//   });
// }
