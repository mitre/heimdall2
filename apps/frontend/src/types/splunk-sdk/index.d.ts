/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '@mitre/splunk-sdk-no-env' {
  export type SplunkConfig = {
    scheme?: 'http' | 'https';
    host: string;
    port?: number;
    username: string;
    password: string;
    index?: string;
    owner?: string;
    app?: string;
    sessionKey?: string;
    autologin?: boolean;
    version?: string;
    insecure?: boolean;
  };

  export type jobTrackCallbacks = {
    done?: (job: Job) => void;
    ready?: (job: Job) => void;
    progress?: (job: Job) => void;
    failed?: (job: Job) => void;
    error?: (err: any) => void;
  };

  class Http {
    constructor();
  }

  class Indexs {
    fetch(callback: (error: any, success: any, indexes: Index[]) => void): void;
  }

  class Index {}

  class Jobs {
    fetch(callback: (error: any, success: any, jobs: Job[]) => void): void;

    create(
      query: string,
      params: unknown,
      callback: (error: any, createdJob: Job) => void
    ): void;
  }

  class Job {
    track(
      options: {period?: number},
      callbacks: jobTrackCallbacks | ((readyStatus: any) => void)
    ): void;

    results(
      params: {count: number},
      callback: (
        err: any,
        results: {fields: string[]; rows: string[]},
        job: Job
      ) => void
    ): void;
  }

  class Service {
    constructor(config: SplunkConfig);
    constructor(httpInstance: any, config: SplunkConfig);

    login(callback: (error: any, success: any) => void): boolean;
    indexes(): Indexs;
    jobs(): Jobs;

    requestOptions: {
      strictSSL: boolean;
    };
  }
}

declare module '@mitre/splunk-sdk-no-env/lib/platform/client/jquery_http';
