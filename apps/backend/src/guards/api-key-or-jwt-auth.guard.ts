/* eslint-disable @typescript-eslint/no-explicit-any */
import {Injectable} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';

@Injectable()
export class APIKeyOrJwtAuthGuard extends AuthGuard(['jwt', 'apikey']) {}
