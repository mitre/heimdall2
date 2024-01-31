import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {GroupProduct} from './group-product.model';

@Module({
  imports: [SequelizeModule.forFeature([GroupProduct])]
})
export class GroupProductsModule {}
