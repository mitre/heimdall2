import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {GroupBuild} from './group-build.model';

@Module({
  imports: [SequelizeModule.forFeature([GroupBuild])]
})
export class GroupBuildsModule {}
