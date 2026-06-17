import {
  All,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import axios from 'axios';
import { Request, Response } from 'express';
import { TenableService } from './tenable.service';

// Extend express-session types to include 'tenable'
declare module 'express-session' {
  type SessionData = {
    tenable?: {
      accesskey: string;
      host_url: string;
      secretkey: string;
    };
  };
}

const TENABLE_CSP_NOT_SET
  = "Cannot set properties of undefined (setting 'tenable')";

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
    @Body() body: { accesskey: string; host_url: string; secretkey: string },
  ) {
    const { accesskey, host_url, secretkey } = body;

    if (!host_url || !accesskey || !secretkey) {
      throw new HttpException('Missing credentials', HttpStatus.BAD_REQUEST);
    }

    try {
      // This helps prevent double slashes in the resulting URL if host_url ends with a slash.
      const fullUrl = `${host_url.replace(/\/$/v, '')}/rest/currentUser`;
      const result = await axios.get(fullUrl, { headers: { 'x-apikey': `accesskey=${accesskey}; secretkey=${secretkey}` } });

      // Assign the Tenable credentials to the session
      req.session.tenable = { accesskey, host_url, secretkey };

      // Return the authenticated user data
      // Note: result.data is already a plain object, no need to convert it.
      return { success: true, user: result.data }; // Return plain object
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.message.includes(TENABLE_CSP_NOT_SET)) {
          throw new HttpException(
            {
              code: 'ERR_NETWORK', // custom application error code (optional)
              message: 'Tenable CSP not set',
              status: HttpStatus.NOT_FOUND,
            },
            HttpStatus.NOT_FOUND,
          );
        } else if (error.response?.status === HttpStatus.UNAUTHORIZED) {
          throw new HttpException(
            {
              code: 'INVALID_CREDENTIALS', // custom application error code (optional)
              message: 'Invalid Tenable credentials',
              status: HttpStatus.UNAUTHORIZED,
            },
            HttpStatus.UNAUTHORIZED,
          );
        } else {
          switch (error.code) {
            case 'ECONNREFUSED': {
              throw new HttpException(
                {
                  code: 'SERVER_UNREACHABLE', // custom app code
                  message: 'Tenable server is unreachable',
                  status: HttpStatus.BAD_GATEWAY,
                },
                HttpStatus.BAD_GATEWAY,
              );
            }
            case 'ENOTFOUND': {
              throw new HttpException(
                {
                  code: 'INVALID_HOST_URL', // custom app code
                  message:
                'Unable to resolve Tenable host URL to an IP address (possible DNS resolution on the hosting platform).',
                  status: HttpStatus.BAD_REQUEST,
                },
                HttpStatus.BAD_REQUEST,
              );
            }
            case 'ETIMEDOUT': {
              throw new HttpException(
                {
                  code: 'CONNECTION_TIMEOUT', // custom application error code (optional)
                  message: 'Tenable server took too long to respond',
                  status: HttpStatus.REQUEST_TIMEOUT,
                },
                HttpStatus.REQUEST_TIMEOUT,
              );
            }
            case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE': {
              throw new HttpException(
                {
                  code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
                  message:
                'SSL certificate verification failed while connecting to Tenable '
                + `(${host_url}). This may be due to an untrusted or incomplete TLS `
                + 'certificate chain.',
                  status: HttpStatus.BAD_GATEWAY,
                },
                HttpStatus.BAD_GATEWAY,
              );
            }
            default: {
              throw new HttpException(
                {
                  code: 'TENABLE_PROXY_ERROR', // Optional custom app code
                  message:
                error.response?.data?.message
                || `Unexpected error connecting to Tenable ${host_url}`,
                  status: error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                },
                error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }
          }
        }
      } else if (error instanceof Error) {
        throw new HttpException(
          {
            code: 'TENABLE_PROXY_ERROR',
            message:
              error.message
              || `Unexpected error connecting to Tenable ${host_url}`,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      } else {
        throw new HttpException(
          {
            code: 'TENABLE_PROXY_ERROR',
            message: `Unexpected error connecting to Tenable ${host_url}: ${JSON.stringify(error, null, 2)}`,
            status: HttpStatus.INTERNAL_SERVER_ERROR,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @All('*splat')
  /**
   * Proxies a request to the Tenable service using the user's session credentials.
   *
   * @param req - The incoming HTTP request object.
   * @param res - The HTTP response object to send the proxied response.
   * @returns Sends the proxied response from the Tenable service or an error response.
   *
   * @throws 401 if the user is not authenticated with Tenable.
   * @throws 404 if user session content is not available.
   * @throws 500 or the proxied error status if the proxy request fails.
   */
  async proxy(@Req() req: Request, @Res() res: Response) {
    try {
      const creds = req.session.tenable;

      // If credentials are missing, user is not authenticated, send 401 Unauthorized.
      if (!creds) {
        return res.status(401).json({ error: 'Not authenticated with Tenable' });
      }

      // Forward the incoming request to the Tenable API using stored credentials.
      // Respond to the client with the status and data from Tenable's response or
      // handle any errors that occur during the proxy request.
      const result = await this.tenableService.proxyRequest(req, creds);
      res.status(result.status).send(result.data);
    } catch (error) {
      const cspMsg = TENABLE_CSP_NOT_SET.replace('set', 'read').replace(
        'setting',
        'reading',
      );

      if (axios.isAxiosError(error)) {
        if (error.message.includes(cspMsg)) {
          throw new HttpException(
            {
              code: 'ERR_NETWORK', // custom application error code (optional)
              message: 'Tenable CSP not set',
              status: HttpStatus.NOT_FOUND,
            },
            HttpStatus.NOT_FOUND,
          );
        } else {
          const status
            = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
          const message = error.response?.data || 'Proxy error';
          res.status(status).send(message);
        }
      } else if (error instanceof Error) {
        if (error.message.includes(cspMsg)) {
          throw new HttpException(
            {
              code: 'ERR_NETWORK',
              message: 'Tenable CSP not set',
              status: HttpStatus.NOT_FOUND,
            },
            HttpStatus.NOT_FOUND,
          );
        } else {
          const status = HttpStatus.INTERNAL_SERVER_ERROR;
          const message = error.message || 'Proxy error';
          res.status(status).send(message);
        }
      } else {
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const message = `Proxy error: ${JSON.stringify(error, null, 2)}`;
        res.status(status).send(message);
      }
    }
  }
}
