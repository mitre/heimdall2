import {forwardRef, Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {ConfigModule} from '../config/config.module';
import {DatabaseModule} from '../database/database.module';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {BuildsModule} from '../builds/builds.module';
import {Product} from './product.model';
import {ProductsController} from './products.controller';
import {ProductsService} from './products.service';
import {UsersModule} from '../users/users.module';
@Module({
  imports: [
    SequelizeModule.forFeature([
      Product,
      Group,
    ]),
    ConfigModule,
    BuildsModule,
    forwardRef(() => UsersModule),
    DatabaseModule
  ],
  providers: [ProductsService, GroupsService],
  controllers: [ProductsController],
  exports: [ProductsService]
})
export class ProductsModule {}
