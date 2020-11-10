import {JwtModule} from '@nestjs/jwt';
import * as crypto from 'crypto';
import {ConfigModule} from '../config/config.module';
import {ConfigService} from '../config/config.service';

function generateDefault(): string {
  return crypto.randomBytes(64).toString('hex');
}

export const tokenProviders = [
  JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => ({
      secret: configService.get('JWT_SECRET') || generateDefault(),
      signOptions: {
        expiresIn: configService.get('JWT_EXPIRE_TIME') || '60s'
      }
    })
  })
];
