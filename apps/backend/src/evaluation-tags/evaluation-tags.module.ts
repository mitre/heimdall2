import {Module} from '@nestjs/common';
import {AuthzModule} from '../authz/authz.module';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {EvaluationTagsController} from './evaluation-tags.controller';
import {EvaluationTagsService} from './evaluation-tags.service';

@Module({
  imports: [
    AuthzModule,
  ],
  providers: [EvaluationsService, EvaluationTagsService],
  controllers: [EvaluationTagsController],
  exports: [EvaluationTagsService],
})
export class EvaluationTagsModule {}
