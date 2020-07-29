import {Module} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {EvaluationTag} from './evaluation-tag.model';
import {EvaluationTagsController} from './evaluation-tags.controller';
import {EvaluationTagsService} from './evaluation-tags.service';

@Module({
  imports: [SequelizeModule.forFeature([EvaluationTag])],
  providers: [EvaluationTagsService],
  controllers: [EvaluationTagsController],
  exports: [EvaluationTagsService]
})
export class EvaluationTagsModule {}
