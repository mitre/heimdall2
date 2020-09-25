import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {ValidationPipe} from '@nestjs/common';
import helmet = require('helmet');
import {json} from 'express';
import {ConfigService} from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  app.use(helmet());
  app.use(json({limit: '50mb'}));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true
    })
  );
  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
