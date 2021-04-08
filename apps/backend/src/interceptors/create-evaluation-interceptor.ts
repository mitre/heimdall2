import {ICreateEvaluation} from '@heimdall/interfaces';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {CreateEvaluationTagDto} from '../evaluation-tags/dto/create-evaluation-tag.dto';
import {GroupsService} from '../groups/groups.service';

@Injectable()
export class CreateEvaluationInterceptor implements NestInterceptor {
  private readonly groupsService: GroupsService;
  constructor(groupsService: GroupsService) {
    this.groupsService = groupsService;
  }

  public intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<ICreateEvaluation> {
    // changing request
    const request = _context.switchToHttp().getRequest();
    if (request.body.public) {
      request.body.public = [true, 'true'].includes(request.body.public);
    }
    if (
      request.body.evaluationTags !== undefined &&
      request.body.evaluationTags !== ''
    ) {
      request.body.evaluationTags = request.body.evaluationTags
        .split(',')
        .map(
          (evaluationTag: string) => new CreateEvaluationTagDto(evaluationTag)
        );
    } else {
      request.body.evaluationTags = [];
    }
    if (request.body.groups !== undefined) {
      request.body.groups = request.body.groups.split(',');
    }

    return next.handle();
  }
}
