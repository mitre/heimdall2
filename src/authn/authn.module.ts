import { Module } from "@nestjs/common";
import { AuthnService } from "./authn.service";
import { UsersModule } from "../users/users.module";
import { LocalStrategy } from "./local.strategy";
import { JwtStrategy } from "./jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { AuthnController } from "./authn.controller";
import { TokenModule } from "../token/token.module";
import { ConfigModule } from "../config/config.module";

@Module({
  imports: [UsersModule, PassportModule, TokenModule, ConfigModule],
  providers: [AuthnService, LocalStrategy, JwtStrategy],
  controllers: [AuthnController]
})
export class AuthnModule {}
