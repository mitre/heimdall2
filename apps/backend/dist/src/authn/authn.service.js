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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthnService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcryptjs_1 = require("bcryptjs");
const crypto = __importStar(require("crypto"));
const config_service_1 = require("../config/config.service");
const users_service_1 = require("../users/users.service");
let AuthnService = class AuthnService {
    constructor(usersService, configService, jwtService) {
        this.usersService = usersService;
        this.configService = configService;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        let user;
        try {
            user = await this.usersService.findByEmail(email);
        }
        catch {
            throw new common_1.UnauthorizedException('Incorrect Username or Password');
        }
        if (user && (await bcryptjs_1.compare(password, user.encryptedPassword))) {
            this.usersService.updateLoginMetadata(user);
            return user;
        }
        else {
            return null;
        }
    }
    async validateOrCreateUser(email, firstName, lastName, creationMethod) {
        let user;
        try {
            user = await this.usersService.findByEmail(email);
        }
        catch {
            const randomPass = crypto.randomBytes(128).toString('hex');
            const createUser = {
                email: email,
                password: randomPass,
                passwordConfirmation: randomPass,
                firstName: firstName,
                lastName: lastName,
                organization: '',
                title: '',
                role: 'user',
                creationMethod: creationMethod
            };
            await this.usersService.create(createUser);
            user = await this.usersService.findByEmail(email);
        }
        if (user) {
            if (user.firstName !== firstName || user.lastName !== lastName) {
                user.firstName = firstName;
                user.lastName = lastName;
                user.save();
            }
            this.usersService.updateLoginMetadata(user);
        }
        return user;
    }
    async login(user) {
        const payload = {
            email: user.email,
            sub: user.id,
            role: user.role,
            forcePasswordChange: user.forcePasswordChange
        };
        if (payload.forcePasswordChange) {
            return {
                userID: user.id,
                accessToken: this.jwtService.sign(payload, { expiresIn: '600s' })
            };
        }
        else {
            return {
                userID: user.id,
                accessToken: this.jwtService.sign(payload)
            };
        }
    }
    splitName(fullName) {
        const nameArray = fullName.split(' ');
        return {
            firstName: nameArray.slice(0, -1).join(' '),
            lastName: nameArray[nameArray.length - 1]
        };
    }
};
AuthnService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_service_1.ConfigService,
        jwt_1.JwtService])
], AuthnService);
exports.AuthnService = AuthnService;
//# sourceMappingURL=authn.service.js.map