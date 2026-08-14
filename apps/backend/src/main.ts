import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import postgresSessionStore from 'connect-pg-simple';
import { json } from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet, { contentSecurityPolicy } from 'helmet';
import multer from 'multer';
import passport from 'passport';
import { createLogger, format, transports } from 'winston';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { assertFipsMode } from './crypto/fips';
import { HashWriteGateService } from './crypto/hash-write-gate.service';
import { generateDefault } from './token/token.providers';

const line = '_______________________________________________\n';
const loggingTimeFormat = 'MMM-DD-YYYY HH:mm:ss Z';
const logger = createLogger({
  format: format.combine(
    format.timestamp({ format: loggingTimeFormat }),
    format.printf(
      info =>
        `${line}[${String([info.timestamp])}] (Authn Service): ${String(info.message)}`,
    ),
  ),
  transports: [new transports.Console()],
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  // ADR-006 §10: assert host FIPS state before anything else — logic lives in
  // the testable module; this call site stays one line.
  assertFipsMode({ fipsMode: configService.get('FIPS_MODE') });
  // ADR-006 §12 mechanism 3: refuse to start against a database whose
  // credential write epoch is newer than this build understands (a downgrade
  // or a pg_dump restore from a newer system) — enforced here in the
  // application because RPM %pre cannot fire on the downgrades it targets,
  // and a container path has no scriptlet at all. The thrown error crashes
  // bootstrap loudly with the operator remedy in the message.
  await app.get(HashWriteGateService).assertMarkerCompatible();
  app.set('query parser', 'extended');
  app.enableShutdownHooks();
  app.use(helmet());
  app.use(
    contentSecurityPolicy({
      directives: {
        // These are the defaults from helmet, except upgrade-insecure-requests
        // is removed since it causes issues for users trying to run over http
        // https://github.com/mitre/heimdall2/issues/787
        // This whole block can be changed back to
        // ...contentSecurityPolicy.getDefaultDirectives()
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
    const PostgresSessionStore = postgresSessionStore(session);
    const sessionStore = new PostgresSessionStore({
      conObject: {
        ...configService.getDbConfig(),
        /* The pg conObject takes mostly the same parameters as Sequelize, except the ssl options,
          those are equal to the dialectOptions passed to sequelize */
        ssl: configService.getSSLConfig(),
      },
      tableName: 'session',
    });
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
        store: sessionStore,
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
        parseInt(configService.get('MAX_FILE_UPLOAD_SIZE') || '50')
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

  app.use((request: any, _res: any, next: any) => {
    logger.debug('Url:', request.url);
    logger.debug('Session:', JSON.stringify(request.session, null, 2));
    next();
  });

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap().catch((error) => {
  // A failed boot must exit nonzero and say why, not surface as an
  // unhandled rejection.
  console.error(error);
  process.exit(1);
});
