import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {SwaggerModule} from '@nestjs/swagger';
import {apiReference} from '@scalar/nestjs-api-reference';
import {cleanupOpenApiDoc} from 'nestjs-zod';
import {json, type Request, type Response, type NextFunction} from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import multer from 'multer';
import winston from 'winston';
import passport = require('passport');
import postgresSessionStore = require('connect-pg-simple');
import session = require('express-session');
import {AppModule} from './app.module';
import {ConfigService} from './config/config.service';
import {buildSwaggerConfig} from './openapi/swagger.config';
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
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  const configService = app.get<ConfigService>(ConfigService);
  app.set('query parser', 'extended');
  app.enableShutdownHooks();
  const helmetMiddleware = helmet();
  const cspMiddleware = helmet.contentSecurityPolicy({
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
    });
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/docs')) {
      return next();
    }
    helmetMiddleware(req, res, () => cspMiddleware(req, res, next));
  });
  // Apply JSON body parsing to all routes EXCEPT /api/auth (better-auth handles its own parsing)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.originalUrl?.startsWith('/api/auth')) {
      return next();
    }
    return json({limit: '50mb'})(req, res, next);
  });
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
          secure: configService.isInProductionMode(),
          httpOnly: true,
          sameSite: 'lax',
        },
        saveUninitialized: false,
        resave: false
      })
    );
    if (configService.isInProductionMode()) {
      app.getHttpAdapter().getInstance().set('trust proxy', 1);
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

  if (!configService.isInProductionMode()) {
    const swaggerConfig = buildSwaggerConfig();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs/swagger', app, cleanupOpenApiDoc(document));
    app.use(
      '/api/docs/scalar.js',
      (_req: Request, res: Response) => {
        const path = require('path');
        res.sendFile(
          path.join(path.dirname(require.resolve('@scalar/api-reference')), 'browser', 'standalone.js')
        );
      }
    );
    app.use(
      '/api/docs',
      apiReference({
        spec: {content: cleanupOpenApiDoc(document)},
        theme: 'kepler',
        cdn: '/api/docs/scalar.js',
      })
    );
  }

  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.debug('Url:', req.url);
    if ('session' in req) {
      logger.debug('Session:', JSON.stringify(req.session, null, 2));
    }
    next();
  });

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
