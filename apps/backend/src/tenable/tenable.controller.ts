import {
  Controller,
  Req,
  Res,
  Post,
  Body,
  HttpException,
  HttpStatus,
  All
} from '@nestjs/common';
import {TenableService} from './tenable.service';
import axios from 'axios';
import {Request, Response} from 'express';

// Extend express-session types to include 'tenable'
declare module 'express-session' {
  interface SessionData {
    tenable?: {
      host_url: string;
      accesskey: string;
      secretkey: string;
    };
  }
}

// NestJS controller that handles Tenable authentication and proxying requests to Tenable
// It allows users to log in with their Tenable credentials and then proxies all subsequent requests
// to the Tenable API, handling authentication via session storage.
@Controller('api/tenable')
export class TenableController {
  constructor(private readonly tenableService: TenableService) {}

  @Post('login')
  /**
   * Authenticates a user with the provided Tenable credentials and stores them in the session.
   *
   * @param req - The incoming HTTP request object, used to access the session.
   * @param body - An object containing the Tenable host URL, access key, and secret key.
   * @returns An object indicating success and the authenticated user's data from Tenable.
   * @throws {HttpException} If any credentials are missing or if authentication fails.
   */
  async login(
    @Req() req: Request,
    @Body() body: {host_url: string; accesskey: string; secretkey: string}
  ) {
    const {host_url, accesskey, secretkey} = body;

    if (!host_url || !accesskey || !secretkey) {
      throw new HttpException('Missing credentials', HttpStatus.BAD_REQUEST);
    }

    try {
      // This helps prevent double slashes in the resulting URL if host_url ends with a slash.
      const fullUrl = `${host_url.replace(/\/$/, '')}/rest/currentUser`;
      const result = await axios.get(fullUrl, {
        headers: {
          'x-apikey': `accesskey=${accesskey}; secretkey=${secretkey}`
        }
      });

      req.session.tenable = {host_url, accesskey, secretkey};

      return {success: true, user: result.data}; // ✅ Return plain object
    } catch (err) {
      if (err.response?.status === 401) {
        throw new HttpException(
          'Invalid Tenable credentials',
          HttpStatus.UNAUTHORIZED
        );
      } else if (err.code === 'ECONNREFUSED') {
        throw new HttpException(
          'Tenable server is unreachable',
          HttpStatus.BAD_GATEWAY
        );
      } else if (err.code === 'ENOTFOUND') {
        throw new HttpException(
          'Tenable host URL is invalid (unable to resolve to an IP address)',
          HttpStatus.BAD_REQUEST
        );
      } else {
        throw new HttpException(
          err.response?.data?.message ||
            `Unexpected error connecting to Tenable ${host_url}`,
          err.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  @All('*')
  /**
   * Proxies a request to the Tenable service using the user's session credentials.
   *
   * @param req - The incoming HTTP request object.
   * @param res - The HTTP response object to send the proxied response.
   * @returns Sends the proxied response from the Tenable service or an error response.
   *
   * @throws 401 if the user is not authenticated with Tenable.
   * @throws 500 or the proxied error status if the proxy request fails.
   */
  async proxy(@Req() req: Request, @Res() res: Response) {
    const creds = req.session.tenable;

    if (!creds) {
      return res.status(401).json({error: 'Not authenticated with Tenable'});
    }

    try {
      const result = await this.tenableService.proxyRequest(req, creds);
      res.status(result.status).send(result.data);
    } catch (err) {
      const status = err.response?.status || 500;
      const message = err.response?.data || 'Proxy error';
      res.status(status).send(message);
    }
  }
}
