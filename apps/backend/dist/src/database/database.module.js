"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("@nestjs/sequelize");
const config_module_1 = require("../config/config.module");
const config_service_1 = require("../config/config.service");
const database_service_1 = require("./database.service");
function getSynchronize(configService) {
    const nodeEnvironment = configService.get('NODE_ENV');
    if (nodeEnvironment === undefined) {
        throw new TypeError('NODE_ENV is not set and must be provided.');
    }
    else {
        return nodeEnvironment === 'test' ? false : true;
    }
}
let DatabaseModule = class DatabaseModule {
};
DatabaseModule = __decorate([
    common_1.Module({
        imports: [
            sequelize_1.SequelizeModule.forRootAsync({
                imports: [config_module_1.ConfigModule],
                inject: [config_service_1.ConfigService],
                useFactory: (configService) => ({
                    ...configService.getDbConfig(),
                    autoLoadModels: true,
                    synchronize: getSynchronize(configService),
                    logging: false,
                    pool: {
                        max: 5,
                        min: 0,
                        acquire: 30000,
                        idle: 10000
                    }
                })
            })
        ],
        providers: [database_service_1.DatabaseService],
        exports: [database_service_1.DatabaseService]
    })
], DatabaseModule);
exports.DatabaseModule = DatabaseModule;
//# sourceMappingURL=database.module.js.map