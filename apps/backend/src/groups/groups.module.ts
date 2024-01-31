import {forwardRef, Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {ApiKeyModule} from '../apikeys/apikeys.module';
import {AuthzModule} from '../authz/authz.module';
import {ConfigModule} from '../config/config.module';
import {EvaluationTagsModule} from '../evaluation-tags/evaluation-tags.module';
import {EvaluationsModule} from '../evaluations/evaluations.module';
import {BuildsModule} from '../builds/builds.module';
import {ProductsModule} from '../products/products.module';
import {UsersModule} from '../users/users.module';
import {Group} from './group.model';
import {GroupsController} from './groups.controller';
import {GroupsService} from './groups.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Group]),
    ApiKeyModule,
    AuthzModule,
    ConfigModule,
    BuildsModule,
    ProductsModule,
    forwardRef(() => UsersModule),
    EvaluationsModule,
    EvaluationTagsModule
  ],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService]
})
export class GroupsModule {}
