"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniqueConstraintErrorFilter = void 0;
const common_1 = require("@nestjs/common");
const sequelize_1 = require("sequelize");
let UniqueConstraintErrorFilter = class UniqueConstraintErrorFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = this.buildMessage(exception.errors);
        response.status(status).json({
            statusCode: status,
            error: 'Internal Server Error',
            message: message
        });
    }
    buildMessage(errors) {
        const builtErrors = [];
        errors.forEach((error) => {
            builtErrors.push(error.message);
        });
        return builtErrors;
    }
};
UniqueConstraintErrorFilter = __decorate([
    common_1.Catch(sequelize_1.UniqueConstraintError)
], UniqueConstraintErrorFilter);
exports.UniqueConstraintErrorFilter = UniqueConstraintErrorFilter;
//# sourceMappingURL=unique-constraint-error.filter.js.map