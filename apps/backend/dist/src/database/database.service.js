"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const sequelize_typescript_1 = require("sequelize-typescript");
let DatabaseService = class DatabaseService {
    constructor(sequelize) {
        this.sequelize = sequelize;
    }
    async closeConnection() {
        await this.sequelize.close();
    }
    async cleanAll() {
        Object.values(this.sequelize.models).forEach((model) => {
            model.destroy({ where: {} });
        });
    }
    getDelta(source, updated) {
        if (source === undefined || updated === undefined) {
            return {
                added: [],
                changed: [],
                deleted: []
            };
        }
        const added = updated.filter((updatedItem) => source.find((sourceItem) => sourceItem.id === updatedItem.id) ===
            undefined);
        const changed = updated.filter((updatedItem) => source.find((sourceItem) => sourceItem.id === updatedItem.id) !==
            undefined);
        const deleted = source.filter((sourceItem) => updated.find((updatedItem) => updatedItem.id === sourceItem.id) ===
            undefined);
        return {
            added: added,
            changed: changed,
            deleted: deleted
        };
    }
};
DatabaseService = __decorate([
    common_1.Injectable(),
    __metadata("design:paramtypes", [sequelize_typescript_1.Sequelize])
], DatabaseService);
exports.DatabaseService = DatabaseService;
//# sourceMappingURL=database.service.js.map