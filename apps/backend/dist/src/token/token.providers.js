"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenProviders = exports.generateDefault = void 0;
const jwt_1 = require("@nestjs/jwt");
const crypto = __importStar(require("crypto"));
const config_module_1 = require("../config/config.module");
const config_service_1 = require("../config/config.service");
function generateDefault() {
    return crypto.randomBytes(64).toString('hex');
}
exports.generateDefault = generateDefault;
exports.tokenProviders = [
    jwt_1.JwtModule.registerAsync({
        imports: [config_module_1.ConfigModule],
        inject: [config_service_1.ConfigService],
        useFactory: (configService) => ({
            secret: configService.get('JWT_SECRET') || generateDefault(),
            signOptions: {
                expiresIn: configService.get('JWT_EXPIRE_TIME') || '60s'
            }
        })
    })
];
//# sourceMappingURL=token.providers.js.map