import {ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {json} from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import {AppModule} from './app.module';
import {ConfigService} from './config/config.service';
import {generateDefault} from './token/token.providers';
import session = require('express-session');
import postgresSessionStore = require('connect-pg-simple');
import helmet from 'helmet';
import passport = require('passport');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
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
        'default-src': ["'self'"],
        'font-src': ["'self'", 'https:', 'data:'],
        'frame-ancestors': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        'script-src': ["'self'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        // This is the only setting that is different from the defaults.
        'connect-src': [
          "'self'",
          'https://api.github.com',
          'https://sts.amazonaws.com',
          configService.getTenableHostUrl(),
          configService.getSplunkHostUrl()
        ].filter((source) => source)
      }
    })
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
        saveUninitialized: true,
        resave: false
      })
    );
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
  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
