import {ForbiddenError} from '@casl/ability';
import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {LoggingService} from '../logging/logging.service';
import {User} from '../users/user.model';
import {CreateEvaluationTagDto} from './dto/create-evaluation-tag.dto';
import {EvaluationTagDto} from './dto/evaluation-tag.dto';
import {EvaluationTagsService} from './evaluation-tags.service';

@Controller('evaluation-tags')
@UseGuards(JwtAuthGuard)
export class EvaluationTagsController {
  constructor(
    private readonly evaluationTagsService: EvaluationTagsService,
    private readonly evaluationsService: EvaluationsService,
    private readonly authz: AuthzService,
    private readonly loggingService: LoggingService
  ) {}

  @Get()
  async index(@Request() request: {user: User}): Promise<EvaluationTagDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    let evaluationTags = await this.evaluationTagsService.findAll();
    evaluationTags = evaluationTags.filter((evaluationTag) =>
      abac.can(Action.Read, evaluationTag.evaluation)
    );
    return evaluationTags.map(
      (evaluationTag) => new EvaluationTagDto(evaluationTag)
    );
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() request: {user: User}
  ): Promise<EvaluationTagDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const evaluationTag = await this.evaluationTagsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Read,
      evaluationTag.evaluation
    );
    return new EvaluationTagDto(evaluationTag);
  }

  @Post(':evaluationId')
  async create(
    @Param('evaluationId') evaluationId: string,
    @Body() createEvaluationTagDto: CreateEvaluationTagDto,
    @Request() request: {user: User},
    @Ip() ip: string
  ): Promise<EvaluationTagDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const evaluation = await this.evaluationsService.findById(evaluationId);
    // Use Action.Update here because any authenticated user can create an evaluation
    // and we wouldn't want anyone to be able to add any tag to any evaluation.
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, evaluation);

    const createdEvaluationTagDto = new EvaluationTagDto(
      await this.evaluationTagsService.create(
        evaluationId,
        createEvaluationTagDto
      )
    );
    this.loggingService.logEvaluationTagAction(
      request,
      ip,
      'Create',
      createdEvaluationTagDto
    );
    return createdEvaluationTagDto;
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Ip() ip: string
  ): Promise<EvaluationTagDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const evaluationTag = await this.evaluationTagsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Delete,
      evaluationTag.evaluation
    );
    const deletedTagDto = new EvaluationTagDto(
      await this.evaluationTagsService.remove(id)
    );
    this.loggingService.logEvaluationTagAction(
      request,
      ip,
      'Delete',
      deletedTagDto
    );
    return deletedTagDto;
  }
}
