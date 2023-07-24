import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {GroupRelation} from './group-relation.model';
import {GroupRelationsController} from './group-relations-controller';
import {GroupRelationsService} from './group-relations.service';

@Module({
  imports: [SequelizeModule.forFeature([GroupRelation])],
  providers: [GroupRelationsService],
  controllers: [GroupRelationsController],
  exports: [GroupRelationsService]
})
export class GroupRelationsModule {}
