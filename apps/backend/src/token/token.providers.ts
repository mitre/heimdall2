import {JwtModule} from '@nestjs/jwt';
import * as crypto from 'crypto';
import ms from 'ms';
import env from '../env';

export function generateDefault(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function limitJWTTime(time: string, logLimit: boolean) {
  const timeMs = ms(time);
  const maxDays = ms('2d');
  if (timeMs > maxDays) {
    if (logLimit) {
      // eslint-disable-next-line no-console
      console.log('JWT Expire time has been limited to two days maximum.');
    }
    return maxDays;
  } else {
    return timeMs;
  }
}

export const tokenProviders = [
  JwtModule.registerAsync({
    useFactory: () => ({
      secret: env.JWT_SECRET || generateDefault(),
      signOptions: {
        expiresIn: limitJWTTime(env.JWT_EXPIRE_TIME, true),
      },
    }),
  }),
];
