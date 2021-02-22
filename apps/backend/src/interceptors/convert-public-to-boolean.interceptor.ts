import {ICreateEvaluation} from '@heimdall/interfaces';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable()
export class UpdateICreateEvaluationInterceptor implements NestInterceptor {
  public intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<ICreateEvaluation> {
    // changing request
    const request = _context.switchToHttp().getRequest();
    if (request.body.name) {
      request.body.name = 'modify request';
    }

    return next.handle().pipe(
      map((createEvaluationDto) => {
        console.log(
          `changing ${createEvaluationDto.public} to ${[true, 'true'].includes(
            createEvaluationDto.public
          )}`
        );
        createEvaluationDto.public = [true, 'true'].includes(
          createEvaluationDto.public
        );

        return createEvaluationDto;
      })
    );
  }
}
