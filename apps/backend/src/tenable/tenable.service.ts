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
  async proxyRequest(request: Request, creds: TenableCredentials) {
    const axiosInstance = axios.create({
      baseURL: creds.host_url,
      headers: {
        'Content-Type': request.get('content-type') || 'application/json',
        'x-apikey': `accesskey=${creds.accesskey}; secretkey=${creds.secretkey}`,
      },
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
