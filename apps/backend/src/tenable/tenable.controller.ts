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

const TENABLE_CSP_NOT_SET =
  "Cannot set properties of undefined (setting 'tenable')";

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

      // Assign the Tenable credentials to the session
      req.session.tenable = {host_url, accesskey, secretkey};

      // Return the authenticated user data
      // Note: result.data is already a plain object, no need to convert it.
      return {success: true, user: result.data}; // Return plain object
    } catch (err) {
      if (err.message.includes(TENABLE_CSP_NOT_SET)) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            message: 'Tenable CSP not set',
            code: 'ERR_NETWORK' // custom application error code (optional)
          },
          HttpStatus.NOT_FOUND
        );
      } else if (err.response?.status === HttpStatus.UNAUTHORIZED) {
        throw new HttpException(
          {
            status: HttpStatus.UNAUTHORIZED,
            message: 'Invalid Tenable credentials',
            code: 'INVALID_CREDENTIALS' // custom application error code (optional)
          },
          HttpStatus.UNAUTHORIZED
        );
      } else if (err.code === 'ECONNREFUSED') {
        throw new HttpException(
          {
            status: HttpStatus.BAD_GATEWAY,
            message: 'Tenable server is unreachable',
            code: 'SERVER_UNREACHABLE' // custom app code
          },
          HttpStatus.BAD_GATEWAY
        );
      } else if (err.code === 'ENOTFOUND') {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message:
              'Unable to resolve Tenable host URL to an IP address (possible DNS resolution on the hosting platform).',
            code: 'INVALID_HOST_URL' // custom app code
          },
          HttpStatus.BAD_REQUEST
        );
      } else if (err.code === 'ETIMEDOUT') {
        throw new HttpException(
          {
            status: HttpStatus.REQUEST_TIMEOUT,
            message: 'Tenable server took too long to respond',
            code: 'CONNECTION_TIMEOUT' // custom application error code (optional)
          },
          HttpStatus.REQUEST_TIMEOUT
        );
      } else if (err.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
        throw new HttpException(
          {
            status: HttpStatus.BAD_GATEWAY,
            message:
              'SSL certificate verification failed while connecting to Tenable ' +
              `(${host_url}). This may be due to an untrusted or incomplete TLS ` +
              'certificate chain.',
            code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
          },
          HttpStatus.BAD_GATEWAY
        );
      } else {
        throw new HttpException(
          {
            status: err.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            message:
              err.response?.data?.message ||
              `Unexpected error connecting to Tenable ${host_url}`,
            code: 'TENABLE_PROXY_ERROR' // Optional custom app code
          },
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
   * @throws 404 if user session content is not available.
   * @throws 500 or the proxied error status if the proxy request fails.
   */
  async proxy(@Req() req: Request, @Res() res: Response) {
    try {
      const creds = req.session.tenable;

      // If credentials are missing, user is not authenticated, send 401 Unauthorized.
      if (!creds) {
        return res.status(401).json({error: 'Not authenticated with Tenable'});
      }

      // Forward the incoming request to the Tenable API using stored credentials.
      // Respond to the client with the status and data from Tenable's response or
      // handle any errors that occur during the proxy request.
      const result = await this.tenableService.proxyRequest(req, creds);
      res.status(result.status).send(result.data);
    } catch (err) {
      if (
        err.message.includes(
          TENABLE_CSP_NOT_SET.replace('set', 'read').replace(
            'setting',
            'reading'
          )
        )
      ) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            message: 'Tenable CSP not set',
            code: 'ERR_NETWORK' // custom application error code (optional)
          },
          HttpStatus.NOT_FOUND
        );
      } else {
        const status = err.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
        const message = err.response?.data || 'Proxy error';
        res.status(status).send(message);
      }
    }
  }
}
