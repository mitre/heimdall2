import {asHexString, randomBytes} from '@heimdall/common/crypto';
import {JwtModule} from '@nestjs/jwt';
import ms from 'ms';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';

export function generateDefault(): string {
  return asHexString(randomBytes(64));
}

export function limitJWTTime(time: string, logLimit: boolean) {
  const timeMs = ms(time);
  const maxDays = ms('2d'); // limit to two days
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
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get('JWT_SECRET') || generateDefault(),
      signOptions: {
        expiresIn: limitJWTTime(
          configService.get('JWT_EXPIRE_TIME') || '60s',
          true
        )
      }
    })
  })
];
