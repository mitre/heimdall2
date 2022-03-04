declare module '@mitre/splunk-sdk-no-env' {
  export type SplunkConfig = {
    scheme?: 'http' | 'https';
    host: string;
    port?: number;
    username: string;
    password: string;
    index: string;
    owner?: string;
    app?: string;
    sessionKey?: string;
    autologin?: boolean;
    version?: string;
    insecure?: boolean;
  };

  class Http {
    constructor();
  }

  class Indexs {
    fetch(callback: (error: any, success: any, indexes: Index[]) => void): void;
  }

  class Index {}

  class Service {
    constructor(config: SplunkConfig);
    constructor(httpInstance: any, config: SplunkConfig);

    login(callback: (error: any, success: any) => void): boolean;
    indexes(): Indexs;

    requestOptions: {
      strictSSL: boolean;
    };
  }
}

declare module '@mitre/splunk-sdk-no-env/lib/platform/client/jquery_http';
