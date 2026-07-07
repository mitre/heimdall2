import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Request } from 'express';

type TenableCredentials = {
  accesskey: string;
  host_url: string;
  secretkey: string;
};

// NestJS service that performs proxied requests to Tenable using credentials stored in the session
@Injectable()
export class TenableService {
  async proxyRequest(req: Request, creds: TenableCredentials) {
    const axiosInstance = axios.create({
      baseURL: creds.host_url,
      headers: {
        'Content-Type': req.get('content-type') || 'application/json',
        'x-apikey': `accesskey=${creds.accesskey}; secretkey=${creds.secretkey}`,
      },
    });

    const method = req.method;
    const url = req.originalUrl.replace('/api/tenable', '');
    const data = req.body;
    const params = req.query;

    return axiosInstance({
      data,
      method,
      params,
      responseType:
        method === 'POST' && req.get('content-type')?.includes('zip')
          ? 'arraybuffer'
          : 'json',
      url,
    });
  }
}
