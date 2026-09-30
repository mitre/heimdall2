import {ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {json} from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
import winston from 'winston';
import passport = require('passport');
import postgresSessionStore = require('connect-pg-simple');
import session = require('express-session');
import {AppModule} from './app.module';
import {ConfigService} from './config/config.service';
import {generateDefault} from './token/token.providers';

const line = '_______________________________________________\n';
const loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
const logger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: winston.format.combine(
    winston.format.timestamp({
      format: loggingTimeFormat
    }),
    winston.format.printf(
      (info) => `${line}[${[info.timestamp]}] (Authn Service): ${info.message}`
    )
  )
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  app.set('query parser', 'extended');
  app.enableShutdownHooks();
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'connect-src': [
            "'self'",
            'https://api.github.com',
            'https://sts.amazonaws.com',
            ...configService.getTenableHostUrl(),
            configService.getSplunkHostUrl(),
          ].filter(Boolean),
          'upgrade-insecure-requests':
            configService
              .get('UPGRADE_INSECURE_REQUESTS_DISABLED')
              ?.toLowerCase() === 'true'
              ? null
              : [],
        },
      },
    }),
  );
  app.use(json({limit: '50mb'}));
  app.use(passport.initialize());
  // Sessions was previously set to only be used for oauth callbacks
  // but now is used for Tenable authentication as well.
  if (
    configService.enabledOauthStrategies().length ||
    configService.getTenableHostUrl().length
  ) {
    app.use(
      session({
        secret: generateDefault(),
        store: new (postgresSessionStore(session))({
          conObject: {
            ...configService.getDbConfig(),
            /* The pg conObject takes mostly the same parameters as Sequelize, except the ssl options,
          those are equal to the dialectOptions passed to sequelize */
            ssl: configService.getSSLConfig()
          },
          tableName: 'session'
        }),
        proxy: configService.isInProductionMode() ? true : undefined,
        cookie: {
          maxAge: 60 * 60 * 1000, // 1 hour
          secure: configService.isInProductionMode()
        },
        saveUninitialized: false,
        resave: false
      })
    );
    if (configService.isInProductionMode()) {
      app.getHttpAdapter().getInstance().set('trust proxy', true);
    }
    app.use(passport.session());
  }
  app.use(
    '/authn/login',
    rateLimit({
      windowMs: 60 * 1000,
      max: 20,
      message: {
        status: 429,
        message: 'Too Many Requests',
        error: 'Ratelimited'
      }
    })
  );
  // Allow for file uploads up to 50 mb
  multer({
    limits: {
      fieldSize:
        parseInt(configService.get('MAX_FILE_UPLOAD_SIZE') || '50') *
        1024 *
        1024
    }
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true
    })
  );

  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.use((req: any, res: any, next: any) => {
    logger.debug('Url:', req.url);
    logger.debug('Session:', JSON.stringify(req.session, null, 2));
    next();
  });

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
