"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaslExceptionFilter = void 0;
const ability_1 = require("@casl/ability");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
let CaslExceptionFilter = class CaslExceptionFilter extends core_1.BaseExceptionFilter {
    catch(exception, host) {
        if (exception instanceof ability_1.ForbiddenError) {
            super.catch(new common_1.ForbiddenException(exception.message), host);
        }
        else {
            super.catch(exception, host);
        }
    }
};
CaslExceptionFilter = __decorate([
    common_1.Catch()
], CaslExceptionFilter);
exports.CaslExceptionFilter = CaslExceptionFilter;
//# sourceMappingURL=casl-exception.filter.js.map