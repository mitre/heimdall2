import { ICreateEvaluation } from '@heimdall/interfaces';
import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GroupsService } from '../groups/groups.service';
export declare class CreateEvaluationInterceptor implements NestInterceptor {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    intercept(_context: ExecutionContext, next: CallHandler): Observable<ICreateEvaluation>;
}
