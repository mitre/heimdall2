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
import helmet = require('helmet');
import passport = require('passport');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // This is the only setting that is different from the defaults.
        'connect-src': [
          "'self'",
          'https://api.github.com',
          'https://sts.amazonaws.com'
        ]
      }
    })
  );
  app.use(json({limit: '50mb'}));
  app.use(
    session({
      secret: configService.get('JWT_SECRET') || generateDefault(),
      store: new (postgresSessionStore(session))({
        conObject: {
          ...configService.getDbConfig(),
          /* The pg conObject takes mostly the same parameters as Sequelize, except the ssl options,
          those are equal to the dialectOptions passed to sequelize */
          ssl: configService.getSSLConfig()
        },
        tableName: 'session'
      }),
      cookie: {maxAge: 30 * 24 * 60 * 60 * 1000},
      saveUninitialized: true,
      resave: false
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
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
