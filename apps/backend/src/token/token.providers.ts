import {JwtModule} from '@nestjs/jwt';
import * as crypto from 'crypto';
import ms from 'ms';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';

export function generateDefault(): string {
  return crypto.randomBytes(64).toString('hex');
}

function limitJWTTime(time: string) {
  const timeMs = ms(time);
  const maxDays = ms('2d'); // limit to two days
  if (timeMs > maxDays) {
    // eslint-disable-next-line no-console
    console.log('JWT Expire time has been limited to two days maximum.');
    return maxDays;
  } else {
    return timeMs;
  }
}

export const tokenProviders = [
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get('JWT_SECRET') || generateDefault(),
      signOptions: {
        expiresIn: limitJWTTime(configService.get('JWT_EXPIRE_TIME') || '60s')
      }
    })
  })
];
