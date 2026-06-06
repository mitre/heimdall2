import {ForbiddenError, subject} from '@casl/ability';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {AnyFilesInterceptor} from '@nestjs/platform-express';
import _ from 'lodash';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {asAuthUser, type RequestUser} from '../common/auth-helpers';
import env from '../env';
import {GroupDto} from '../groups/dto/group.dto';
import {GroupsService} from '../groups/groups.service';
import {CreateEvaluationInterceptor} from '../interceptors/create-evaluation-interceptor';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {CreateEvaluationDto} from './dto/create-evaluation.dto';
import {EvaluationDto, IEvaluationResponse} from './dto/evaluation.dto';
import {paginationQuerySchema} from './dto/pagination-query.schema';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {EvaluationsService} from './evaluations.service';

@Controller('evaluations')
@UseInterceptors(LoggingInterceptor)
export class EvaluationsController {
  constructor(
    private readonly evaluationsService: EvaluationsService,
    private readonly groupsService: GroupsService,
    private readonly authz: AuthzService,
  ) {}

  @Get('e2e')
  async findAll(@Request() request: {user: RequestUser}): Promise<EvaluationDto[]> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const all = await this.evaluationsService.findAll();
    const readable = all.filter((evaluation) =>
      abac.can(Action.Read, subject('Evaluation', {...evaluation, id: String(evaluation.id)})),
    );
    return readable.map(
      (evaluation) =>
        new EvaluationDto(
          evaluation,
          abac.can(Action.Update, subject('Evaluation', {...evaluation, id: String(evaluation.id)})),
        ),
    );
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() request: {user: RequestUser},
  ): Promise<EvaluationDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const evaluation = await this.evaluationsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Read,
      subject('Evaluation', {...evaluation, id: String(evaluation.id)}),
    );
    return new EvaluationDto(evaluation, abac.can(
      Action.Update,
      subject('Evaluation', {...evaluation, id: String(evaluation.id)}),
    ));
  }

  @Get(':id/groups')
  async groupsForEvaluation(
    @Param('id') id: string,
    @Request() request: {user: RequestUser},
  ): Promise<GroupDto[]> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const evaluationGroups = await this.evaluationsService.groups(id);
    const filtered = evaluationGroups.filter(
      (group) =>
        abac.can(Action.AddEvaluation, subject('Group', {...group, id: String(group.id)})) &&
        abac.can(Action.RemoveEvaluation, subject('Group', {...group, id: String(group.id)})),
    );
    return filtered.map((group) => new GroupDto(group));
  }

  @Get()
  async findAndCountAll(
    @Query() rawParams: Record<string, unknown>,
    @Request() request: {user: RequestUser},
  ): Promise<IEvaluationResponse> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const parsed = paginationQuerySchema.safeParse(rawParams);
    const params = parsed.success
      ? parsed.data
      : {page: 1, perPage: 25, sort: 'createdAt' as const, order: 'desc' as const, q: undefined};

    const result = await this.evaluationsService.findPaginated({
      page: params.page,
      perPage: params.perPage,
      sort: params.sort,
      order: params.order as 'asc' | 'desc',
      q: params.q,
      userId: String(request.user.id),
      role: request.user.role,
    });

    return {
      evaluations: result.data.map(
        (evaluation) =>
          new EvaluationDto(
            evaluation,
            abac.can(Action.Update, subject('Evaluation', {...evaluation, id: String(evaluation.id)})),
          ),
      ),
      totalCount: result.meta.total,
      meta: result.meta,
    };
  }

  @Post()
  @UseInterceptors(
    AnyFilesInterceptor({limits: {files: 100}}),
    CreateEvaluationInterceptor,
  )
  async create(
    @Body() createEvaluationDto: CreateEvaluationDto,
    @UploadedFiles() data: Express.Multer.File[],
    @Request() request: {user: RequestUser & {groupId?: number}},
  ): Promise<EvaluationDto | EvaluationDto[]> {
    const uploadedFiles = data.map(async (file) => {
      let serializedDta: Record<string, unknown>;
      try {
        serializedDta = JSON.parse(file.buffer.toString('utf8'));
      } catch {
        serializedDta = {originalResultsData: file.buffer.toString('utf8')};
      }

      const isGroupApiKey = 'groupId' in request.user && request.user.groupId != null;

      if (isGroupApiKey) {
        const groupId = Number(request.user.groupId);
        const evaluation = await this.evaluationsService
          .create({
            filename:
              data.length > 1
                ? file.originalname
                : createEvaluationDto.filename,
            evaluationTags: createEvaluationDto.evaluationTags || [],
            public: createEvaluationDto.public,
            data: serializedDta,
            groupId,
          })
          .then(async (evaluation) => {
            const group = await this.groupsService.findByPkBang(String(groupId));
            await this.groupsService.addEvaluationToGroup(group.id, evaluation.id);
            return evaluation;
          })
          .catch((err) => {
            throw new BadRequestException(err.message);
          });

        const createdDto = new EvaluationDto(evaluation, true);
        return _.omit(createdDto, 'data');
      } else {
        const groupResults = createEvaluationDto.groups
          ? await this.groupsService.findByIds(createEvaluationDto.groups)
          : [];

        const abac = this.authz.abac.createForUser(asAuthUser(request.user));
        const allowedGroups = groupResults.filter((group) =>
          abac.can(Action.AddEvaluation, subject('Group', {...group, id: String(group.id)})),
        );

        const evaluation = await this.evaluationsService
          .create({
            filename:
              data.length > 1
                ? file.originalname
                : createEvaluationDto.filename,
            evaluationTags: createEvaluationDto.evaluationTags || [],
            public: createEvaluationDto.public,
            data: serializedDta,
            userId: Number.isFinite(Number(request.user.id)) ? Number(request.user.id) : undefined,
          })
          .then(async (createdEvaluation) => {
            for (const group of allowedGroups) {
              await this.groupsService.addEvaluationToGroup(group.id, createdEvaluation.id);
            }
            return createdEvaluation;
          });

        const createdDto = new EvaluationDto(
          evaluation,
          true,
          `${env.EXTERNAL_URL}/results/${evaluation.id}`,
        );
        return _.omit(createdDto, 'data');
      }
    });

    if (uploadedFiles.length === 1) {
      return uploadedFiles[0];
    }
    return Promise.all(uploadedFiles);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() request: {user: RequestUser},
    @Body() updateEvaluationDto: UpdateEvaluationDto,
  ): Promise<EvaluationDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const evaluationToUpdate = await this.evaluationsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Update,
      subject('Evaluation', {...evaluationToUpdate, id: String(evaluationToUpdate.id)}),
    );

    const updatedEvaluation = await this.evaluationsService.update(id, updateEvaluationDto);

    return new EvaluationDto(
      updatedEvaluation,
      abac.can(Action.Update, subject('Evaluation', {...updatedEvaluation, id: String(updatedEvaluation.id)})),
    );
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() request: {user: RequestUser},
  ): Promise<EvaluationDto> {
    const abac = this.authz.abac.createForUser(asAuthUser(request.user));
    const evaluationToDelete = await this.evaluationsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(
      Action.Delete,
      subject('Evaluation', {...evaluationToDelete, id: String(evaluationToDelete.id)}),
    );
    return new EvaluationDto(await this.evaluationsService.remove(id));
  }
}
