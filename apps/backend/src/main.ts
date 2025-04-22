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
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels in development
  });
  
  const configService = app.get<ConfigService>(ConfigService);
  app.enableShutdownHooks();
  
  // Setup Helmet for security headers
  app.use(helmet());
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        // These are the defaults from helmet, except upgrade-insecure-requests
        // is removed since it causes issues for users trying to run over http
        // https://github.com/mitre/heimdall2/issues/787
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
  
  // Setup JSON parsing with increased limit
  app.use(json({limit: '50mb'}));
  
  // Initialize Passport (must come before session middleware)
  app.use(passport.initialize());
  
  // Trust proxy in production - important for cookies behind load balancers/proxies
  if (configService.isInProductionMode()) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }
  
  // Sessions for authentication
  if (configService.enabledOauthStrategies().length) {
    // Configure session store
    const store = new (postgresSessionStore(session))({
      conObject: {
        ...configService.getDbConfig(),
        ssl: configService.getSSLConfig()
      },
      tableName: 'session',
      createTableIfMissing: true, // Auto-create the session table if it doesn't exist
    });
    
    // Session middleware configuration
    app.use(
      session({
        name: 'heimdall.sid', // Custom name to avoid collisions
        secret: generateDefault(),
        store: store,
        proxy: configService.isInProductionMode(),
        cookie: {
          maxAge: 60 * 60 * 1000, // 1 hour
          secure: configService.isInProductionMode(),
          httpOnly: true,
          sameSite: 'lax' // Balances security and usability
        },
        saveUninitialized: false, // Don't create sessions for non-authenticated users
        resave: false,
        rolling: true // Reset cookie expiration on each request
      })
    );
    
    // Setup passport session handling (must come after session middleware)
    app.use(passport.session());
    
    // Add default serialization/deserialization for Passport
    // This is needed for session support with all authentication strategies
    passport.serializeUser((user: any, done) => {
      done(null, user);
    });
    
    passport.deserializeUser((obj: any, done) => {
      done(null, obj);
    });
  }
  
  // Rate limiting for login attempts
  app.use(
    '/authn/login',
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 20, // Max 20 requests per minute
      message: {
        status: 429,
        message: 'Too Many Requests',
        error: 'Ratelimited'
      }
    })
  );
  
  // Configuration for file uploads
  multer({
    limits: {
      fieldSize:
        parseInt(configService.get('MAX_FILE_UPLOAD_SIZE') || '50') *
        1024 *
        1024
    }
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true
    })
  );
  
  // Add session debugging middleware in non-production environments
  if (!configService.isInProductionMode()) {
    app.use((req: any, res: any, next: any) => {
      if (req.url.includes('/authn/')) {
        console.log('Auth Request URL:', req.url);
        console.log('Session ID:', req.sessionID);
        console.log('Session:', req.session);
        console.log('Cookies:', req.cookies);
      }
      next();
    });
  }

  await app.listen(configService.get('PORT') || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap().catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});