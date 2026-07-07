import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import postgresSessionStore = require('connect-pg-simple');
import { json } from 'express';
import rateLimit from 'express-rate-limit';
import session = require('express-session');
import helmet from 'helmet';
import multer from 'multer';
import passport = require('passport');
import winston from 'winston';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { generateDefault } from './token/token.providers';

const line = '_______________________________________________\n';
const loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: loggingTimeFormat }),
    winston.format.printf(
      info => `${line}[${[info.timestamp]}] (Authn Service): ${info.message}`,
    ),
  ),
  transports: [new winston.transports.Console()],
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  app.set('query parser', 'extended');
  app.enableShutdownHooks();
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        // These are the defaults from helmet, except upgrade-insecure-requests
        // is removed since it causes issues for users trying to run over http
        // https://github.com/mitre/heimdall2/issues/787
        // This whole block can be changed back to
        // ...helmet.contentSecurityPolicy.getDefaultDirectives()
        // If heimdall begins providing users with an easy way to generate a SSL
        // certificate as part of deployment.
        'base-uri': ["'self'"],
        'block-all-mixed-content': [],
        // This is the only setting that is different from the defaults.
        'connect-src': [
          "'self'",
          'https://api.github.com',
          'https://sts.amazonaws.com',
          configService.getTenableHostUrl(),
          configService.getSplunkHostUrl(),
        ].filter(Boolean),
        'default-src': ["'self'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'frame-ancestors': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        'script-src': ["'self'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
      },
    }),
  );
  app.use(json({ limit: '50mb' }));
  app.use(passport.initialize());
  // Sessions was previously set to only be used for oauth callbacks
  // but now is used for Tenable authentication as well.
  if (
    configService.enabledOauthStrategies().length > 0
    || configService.getTenableHostUrl().length > 0
  ) {
    app.use(
      session({
        cookie: {
          maxAge: 60 * 60 * 1000, // 1 hour
          secure: configService.isInProductionMode(),
        },
        proxy: configService.isInProductionMode() ? true : undefined,
        resave: false,
        saveUninitialized: false,
        secret: generateDefault(),
        store: new (postgresSessionStore(session))({
          conObject: {
            ...configService.getDbConfig(),
            /* The pg conObject takes mostly the same parameters as Sequelize, except the ssl options,
          those are equal to the dialectOptions passed to sequelize */
            ssl: configService.getSSLConfig(),
          },
          tableName: 'session',
        }),
      }),
    );
    if (configService.isInProductionMode()) {
      app.getHttpAdapter().getInstance().set('trust proxy', true);
    }
    app.use(passport.session());
  }
  app.use(
    '/authn/login',
    rateLimit({
      max: 20,
      message: {
        error: 'Ratelimited',
        message: 'Too Many Requests',
        status: 429,
      },
      windowMs: 60 * 1000,
    }),
  );
  // Allow for file uploads up to 50 mb
  multer({
    limits: {
      fieldSize:
        Number.parseInt(configService.get('MAX_FILE_UPLOAD_SIZE') || '50')
        * 1024
        * 1024,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.use((req: any, res: any, next: any) => {
    logger.debug('Url:', req.url);
    logger.debug('Session:', JSON.stringify(req.session, null, 2));
    next();
  });

  if (!configService.get('HEIMDALL_BACKEND_PORT') && configService.get('PORT')) {
    logger.warn('DEPRECATED: PORT env var is deprecated. Use HEIMDALL_BACKEND_PORT instead. PORT will be removed in the next minor release.');
  }
  const port = configService.get('HEIMDALL_BACKEND_PORT') || configService.get('PORT') || 3000;
  await app.listen(port);
}
bootstrap();
