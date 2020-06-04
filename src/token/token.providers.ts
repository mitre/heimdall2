import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import * as crypto from 'crypto';

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
]

function generateDefault(): string {
  return crypto.randomBytes(64).toString('hex');
}
