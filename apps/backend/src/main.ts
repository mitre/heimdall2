import {ValidationPipe} from '@nestjs/common';
import {NestFactory} from '@nestjs/core';
import {json, RequestHandler} from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import {AppModule} from './app.module';
import {ConfigService} from './config/config.service';
import {generateDefault} from './token/token.providers';
import session = require('express-session');
import postgresSessionStore = require('connect-pg-simple');
import helmet from 'helmet';
// import passport = require('passport');
import {ExpressOIDC} from '@okta/oidc-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
	const oktaTenant = `${configService.get('OKTA_TENANT')?.startsWith('/') ? '' : '/'}${configService.get('OKTA_TENANT')}`;
	console.log(`attempted issuer https://${configService.get('OKTA_DOMAIN')}/oauth2${oktaTenant}`);
	const oidc = new ExpressOIDC({
		issuer: `https://${configService.get('OKTA_DOMAIN')}/oauth2${oktaTenant}`,
		client_id: configService.get('OKTA_CLIENTID') ?? 'disabled',
		client_secret: configService.get('OKTA_CLIENTSECRET') ?? 'disabled',
		appBaseUrl: configService.get('EXTERNAL_URL') ?? 'disabled',
		scope: 'openid email profile',
		routes: {
			login: {
				path: '/authn/okta'
			},
			loginCallback: {
				path: '/authn/okta/callback',
				// failureRedirect: '/login',
				handler: ((req, _res, next) => {
					console.log('okta login handler request successful before redirect');
					console.log(JSON.stringify(req.userContext, null, 2));
					console.log(req.isAuthenticated());
					next();
				}) as RequestHandler,
				afterCallback: '/authn/okta/loggedin'
			},
			logout: {
				path: '/authn/okta/logout'
			},
			logoutCallback: {
				path: '/logout'
			}
		}
	});
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
  // app.use(passport.initialize());
  // Sessions are only used for oauth callbacks
  // if (configService.enabledOauthStrategies().length) {
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
          maxAge: 60 * 60 * 1000,
          secure: configService.isInProductionMode()
        }, // 1 hour
        saveUninitialized: false,
        resave: false
      })
    );
    if (configService.isInProductionMode()) {
      app.getHttpAdapter().getInstance().set('trust proxy', true);
    }
		app.use(oidc.router);
    // app.use(passport.session());
  // }
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
    console.log('Session:', JSON.stringify(req.session, null, 2));
    next();
  });

	console.log('end of bootstrap function');

	oidc.on('ready', async () => {
		console.log('enters oidc ready state');
  await app.listen(configService.get('PORT') || 3000);
	});

	oidc.on('error', err => {
		console.log('oidc error');
		console.log(JSON.stringify(err, null, 2));
	});
}
bootstrap();
