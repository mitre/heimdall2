import {Injectable} from '@nestjs/common';
import axios from 'axios';
import {Request} from 'express';

interface TenableCredentials {
  host_url: string;
  accesskey: string;
  secretkey: string;
}

// NestJS service that performs proxied requests to Tenable using credentials stored in the session
@Injectable()
export class TenableService {
  async proxyRequest(req: Request, creds: TenableCredentials) {
    const axiosInstance = axios.create({
      baseURL: creds.host_url,
      headers: {
        'x-apikey': `accesskey=${creds.accesskey}; secretkey=${creds.secretkey}`,
        'Content-Type': req.get('content-type') || 'application/json'
      }
    });

    const method = req.method;
    const url = req.originalUrl.replace('/api/tenable', '');
    const data = req.body;
    const params = req.query;

    return axiosInstance({
      method,
      url,
      data,
      params,
      responseType:
        method === 'GET' && req.get('accept')?.includes('zip')
          ? 'arraybuffer'
          : 'json'
    });
  }
}
