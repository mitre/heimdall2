import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {GroupRelation} from './group-relation.model';

@Module({
  imports: [SequelizeModule.forFeature([GroupRelation])]
})
export class GroupRelationsModule {}
