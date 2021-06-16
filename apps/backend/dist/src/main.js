"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const multer_1 = __importDefault(require("multer"));
const app_module_1 = require("./app.module");
const config_service_1 = require("./config/config.service");
const token_providers_1 = require("./token/token.providers");
const session = require("express-session");
const postgresSessionStore = require("connect-pg-simple");
const helmet = require("helmet");
const passport = require("passport");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_service_1.ConfigService);
    app.use(helmet());
    app.use(helmet.contentSecurityPolicy({
        directives: {
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
            'connect-src': [
                "'self'",
                'https://api.github.com',
                'https://sts.amazonaws.com'
            ]
        }
    }));
    app.use(express_1.json({ limit: '50mb' }));
    app.use(session({
        secret: configService.get('JWT_SECRET') || token_providers_1.generateDefault(),
        store: new (postgresSessionStore(session))({
            conObject: {
                ...configService.getDbConfig(),
                ssl: configService.getSSLConfig()
            },
            tableName: 'session'
        }),
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
        saveUninitialized: true,
        resave: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use('/authn/login', express_rate_limit_1.default({
        windowMs: 60 * 1000,
        max: 20,
        message: {
            status: 429,
            message: 'Too Many Requests',
            error: 'Ratelimited'
        }
    }));
    multer_1.default({
        limits: {
            fieldSize: parseInt(configService.get('MAX_FILE_UPLOAD_SIZE') || '50') *
                1024 *
                1024
        }
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true
    }));
    await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map