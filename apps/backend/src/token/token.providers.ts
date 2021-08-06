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
  return timeMs > 172800000 ? 172800000 : timeMs; // Limit to two days
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
