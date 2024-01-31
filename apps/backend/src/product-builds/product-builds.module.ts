import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {ProductBuild} from './product-builds.model';

@Module({
  imports: [SequelizeModule.forFeature([ProductBuild])]
})
export class ProductBuildsModule {}
