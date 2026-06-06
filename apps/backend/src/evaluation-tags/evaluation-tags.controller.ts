import {ForbiddenError, subject} from '@casl/ability';
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Request,
  UseInterceptors,
} from '@nestjs/common';
import {AuthzService} from '../authz/authz.service';
import {Action, type AuthUser} from '../casl/casl-ability.factory';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {CreateEvaluationTagDto} from './dto/create-evaluation-tag.dto';
import {EvaluationTagDto} from './dto/evaluation-tag.dto';
import {EvaluationTagsService} from './evaluation-tags.service';

interface EvaluationWithGroups {
  id: number;
  userId: number | null;
  public: boolean;
  groupEvaluations: Array<{
    group: {
      id: number;
      groupUsers: Array<{
        role: string;
        user: {id: number} | null;
      }>;
    } | null;
  }>;
}

function evaluationForCasl(evaluation: EvaluationWithGroups) {
  return subject('Evaluation', {
    id: String(evaluation.id),
    userId: evaluation.userId != null ? String(evaluation.userId) : null,
    public: evaluation.public,
    groupEvaluations: evaluation.groupEvaluations
      .filter((ge): ge is typeof ge & {group: NonNullable<typeof ge.group>} => ge.group != null)
      .map((ge) => ({
        group: {
          id: String(ge.group.id),
          groupUsers: ge.group.groupUsers
            .filter((gu): gu is typeof gu & {user: NonNullable<typeof gu.user>} => gu.user != null)
            .map((gu) => ({
              user: {id: String(gu.user.id)},
              role: gu.role,
            })),
        },
      })),
  });
}

@Controller('evaluation-tags')
@UseInterceptors(LoggingInterceptor)
export class EvaluationTagsController {
  constructor(
    private readonly evaluationTagsService: EvaluationTagsService,
    private readonly evaluationsService: EvaluationsService,
    private readonly authz: AuthzService,
  ) {}

  @Get()
  async index(@Request() request: {user: AuthUser}): Promise<EvaluationTagDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    const evaluationTags = await this.evaluationTagsService.findAll();
    const readable = evaluationTags.filter((evaluationTag) => {
      if (!evaluationTag.evaluation) return false;
      return abac.can(Action.Read, evaluationForCasl(evaluationTag.evaluation));
    });
    return readable.map(
      (evaluationTag) => new EvaluationTagDto(evaluationTag),
    );
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() request: {user: AuthUser},
  ): Promise<EvaluationTagDto> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId < 1) {
      throw new NotFoundException('EvaluationTag with given id not found');
    }
    const abac = this.authz.abac.createForUser(request.user);
    const evaluationTag = await this.evaluationTagsService.findById(numericId);
    if (!evaluationTag.evaluation) {
      throw new NotFoundException('EvaluationTag has no associated evaluation');
    }
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Read,
      evaluationForCasl(evaluationTag.evaluation),
    );
    return new EvaluationTagDto(evaluationTag);
  }

  @Post(':evaluationId')
  async create(
    @Param('evaluationId') evaluationId: string,
    @Body() createEvaluationTagDto: CreateEvaluationTagDto,
    @Request() request: {user: AuthUser},
  ): Promise<EvaluationTagDto> {
    const numericEvalId = Number(evaluationId);
    if (!Number.isFinite(numericEvalId) || numericEvalId < 1) {
      throw new NotFoundException('Evaluation with given id not found');
    }
    const abac = this.authz.abac.createForUser(request.user);
    const evaluation = await this.evaluationsService.findById(evaluationId);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, evaluation);

    return new EvaluationTagDto(
      await this.evaluationTagsService.create(
        numericEvalId,
        createEvaluationTagDto,
      ),
    );
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() request: {user: AuthUser},
  ): Promise<EvaluationTagDto> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId < 1) {
      throw new NotFoundException('EvaluationTag with given id not found');
    }
    const abac = this.authz.abac.createForUser(request.user);
    const evaluationTag = await this.evaluationTagsService.findById(numericId);
    if (!evaluationTag.evaluation) {
      throw new NotFoundException('EvaluationTag has no associated evaluation');
    }
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Delete,
      evaluationForCasl(evaluationTag.evaluation),
    );
    return new EvaluationTagDto(
      await this.evaluationTagsService.remove(numericId),
    );
  }
}
