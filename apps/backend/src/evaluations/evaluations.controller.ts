import {ForbiddenError, Subject} from '@casl/ability';
import {IEvalPaginationParams} from '@heimdall/common/interfaces';
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
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {AnyFilesInterceptor} from '@nestjs/platform-express';
import _ from 'lodash';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {ConfigService} from '../config/config.service';
import {GroupDto} from '../groups/dto/group.dto';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {APIKeyOrJwtAuthGuard} from '../guards/api-key-or-jwt-auth.guard';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {CreateEvaluationInterceptor} from '../interceptors/create-evaluation-interceptor';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {CreateEvaluationDto} from './dto/create-evaluation.dto';
import {EvaluationDto, IEvaluationResponse} from './dto/evaluation.dto';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {Evaluation} from './evaluation.model';
import {EvaluationsService} from './evaluations.service';
import {convertReport} from './report-conversion';

@Controller('evaluations')
@UseInterceptors(LoggingInterceptor)
export class EvaluationsController {
  constructor(
    private readonly evaluationsService: EvaluationsService,
    private readonly groupsService: GroupsService,
    private readonly configService: ConfigService,
    private readonly authz: AuthzService
  ) {}

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() request: {user: User}
  ): Promise<EvaluationDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const evaluation = await this.evaluationsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, evaluation);
    return new EvaluationDto(evaluation, abac.can(Action.Update, evaluation));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/groups')
  async groupsForEvaluation(
    @Param('id') id: string,
    @Request() request: {user: User}
  ): Promise<GroupDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    let evaluationGroups = await this.evaluationsService.groups(id);
    evaluationGroups = evaluationGroups.filter(
      (group) =>
        abac.can(Action.AddEvaluation, group) &&
        abac.can(Action.RemoveEvaluation, group)
    );
    return evaluationGroups.map((group) => new GroupDto(group));
  }

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Get('e2e')
  async findAll(@Request() request: {user: User}): Promise<EvaluationDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    let evaluations = await this.evaluationsService.findAll();

    evaluations = evaluations.filter((evaluation) =>
      abac.can(Action.Read, evaluation)
    );

    return evaluations.map(
      (evaluation) =>
        new EvaluationDto(evaluation, abac.can(Action.Update, evaluation))
    );
  }

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Get()
  async findAndCountAll(
    @Query() params: IEvalPaginationParams,
    @Request() request: {user: User}
  ): Promise<IEvaluationResponse> {
    const abac = this.authz.abac.createForUser(request.user);
    let evaluations: Evaluation[] = [];
    let totalItems = 0;

    if (params.useClause) {
      const response = await this.evaluationsService.getEvaluationsWithClause(
        params,
        request.user.email,
        request.user.role
      );
      evaluations = response.evaluations;
      totalItems = response.totalItems;
    } else {
      const response = await this.evaluationsService.getAllEvaluations(
        params,
        request.user.email,
        request.user.role
      );
      evaluations = response.evaluations;
      totalItems = response.totalItems;
    }

    // Perform an policy-based access control (AKA Attribute-based access control)
    // Show public evaluations, evaluations that belong to a group the logged-in user
    // belongs too, or those created by logged-in user.
    evaluations = evaluations.filter((evaluation: Subject) =>
      abac.can(Action.Read, evaluation)
    );

    return {
      evaluations: evaluations.map(
        (evaluation: Evaluation) =>
          new EvaluationDto(evaluation, abac.can(Action.Update, evaluation))
      ),
      totalCount: totalItems
    };
  }

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Post()
  @UseInterceptors(
    AnyFilesInterceptor({limits: {files: 100}}),
    CreateEvaluationInterceptor
  )
  async create(
    @Body() createEvaluationDto: CreateEvaluationDto,
    @UploadedFiles() data: Express.Multer.File[],
    @Request() request: {user: User | Group}
  ): Promise<EvaluationDto | EvaluationDto[]> {
    if (!data?.length) {
      throw new BadRequestException('At least one report file is required.');
    }

    // Convert and validate every report before persisting any of the uploads.
    const convertedFiles = await Promise.all(
      data.map(async (file) => ({
        file,
        evaluations: await convertReport(
          file.buffer.toString('utf8'),
          file.originalname
        )
      }))
    );
    const uploads = convertedFiles.map(({file, evaluations}) => {
      const filename =
        data.length > 1 ? file.originalname : createEvaluationDto.filename;
      return {
        originalFile: {filename: file.originalname, data: file.buffer},
        evaluations: evaluations.map((hdf, index) => ({
          data: hdf,
          filename:
            evaluations.length > 1
              ? `${filename.replace(/\.[^.]*$/, '')}-${index + 1}.json`
              : filename
        }))
      };
    });

    const isGroup = request.user instanceof Group;
    let groups: Group[];
    if (isGroup) {
      groups = [await this.groupsService.findByPkBang(request.user.id)];
    } else {
      const abac = this.authz.abac.createForUser(request.user as User);
      const requestedGroups = createEvaluationDto.groups
        ? await this.groupsService.findByIds(createEvaluationDto.groups)
        : [];
      groups = requestedGroups.filter((group) =>
        abac.can(Action.AddEvaluation, group)
      );
    }

    const evaluations = await this.evaluationsService.createUploads(uploads, {
      evaluationTags: createEvaluationDto.evaluationTags || [],
      public: createEvaluationDto.public,
      ...(isGroup ? {groupId: request.user.id} : {userId: request.user.id}),
      groupIds: groups.map((group) => group.id)
    });
    const response = evaluations.map((evaluation) =>
      _.omit(
        new EvaluationDto(
          evaluation,
          true,
          isGroup
            ? undefined
            : `${this.configService.getExternalUrl()}/results/${evaluation.id}`
        ),
        'data'
      )
    );
    return response.length === 1 ? response[0] : response;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() updateEvaluationDto: UpdateEvaluationDto
  ): Promise<EvaluationDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const evaluationToUpdate = await this.evaluationsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, evaluationToUpdate);

    const updatedEvaluation = await this.evaluationsService.update(
      id,
      updateEvaluationDto
    );

    return new EvaluationDto(
      updatedEvaluation,
      abac.can(Action.Update, updatedEvaluation)
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() request: {user: User}
  ): Promise<EvaluationDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const evaluationToDelete = await this.evaluationsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Delete, evaluationToDelete);
    return new EvaluationDto(await this.evaluationsService.remove(id));
  }
}
