import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';
import { ConfigService } from '../config/config.service';
import { createTenableAgents } from './tenable-filtering-agent';

type TenableCredentials = {
  accesskey: string;
  host_url: string;
  secretkey: string;
};

// NestJS service that performs proxied requests to Tenable using credentials stored in the session
@Injectable()
export class TenableService {
  constructor(private readonly configService: ConfigService) {}

  async proxyRequest(request: Request, creds: TenableCredentials) {
    // Both agents, because axios selects by the target's protocol. Configured
    // here as well as on the login probe in tenable.controller.ts — two axios
    // configurations, and filtering one does not filter the other.
    const { httpAgent, httpsAgent } = createTenableAgents({
      allowPrivateAddresses: this.configService.isTenablePrivateAddressAllowed(),
    });
    const axiosInstance = axios.create({
      baseURL: creds.host_url,
      headers: {
        'Content-Type': request.get('content-type') || 'application/json',
        'x-apikey': `accesskey=${creds.accesskey}; secretkey=${creds.secretkey}`,
      },
      // The SECOND of three SSRF controls (heimdall2-86f6.12). The allowlist
      // decides where a request may be SENT; it cannot decide where the
      // RESPONSE sends it next. axios follows up to 21 redirects by default, so
      // without this an allowlisted host answering `302 Location:
      // http://169.254.169.254/...` moves the request somewhere the allowlist
      // never approved — and this path forwards the result to the caller.
      // 0 means follow none; axios then settles the 3xx as an error, because
      // its default validateStatus accepts 2xx only.
      //
      // This instance is configured SEPARATELY from the login probe in
      // tenable.controller.ts. They are two axios configurations and fixing one
      // does not fix the other.
      maxRedirects: 0,
      httpAgent,
      httpsAgent,
    });

    const method = request.method;
    const url = request.originalUrl.replace('/api/tenable', '');
    const data = request.body;
    const parameters = request.query;

    return axiosInstance({
      data,
      method,
      params: parameters,
      responseType:
        method === 'POST' && request.get('content-type')?.includes('zip')
          ? 'arraybuffer'
          : 'json',
      url,
    });
  }
}
