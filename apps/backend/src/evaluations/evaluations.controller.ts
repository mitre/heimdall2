import {ForbiddenError} from '@casl/ability';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import {EvaluationDto} from './dto/evaluation.dto';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {EvaluationsService} from './evaluations.service';

@Controller('evaluations')
@UseInterceptors(LoggingInterceptor)
export class EvaluationsController {
  constructor(
    private readonly evaluationsService: EvaluationsService,
    private readonly groupsService: GroupsService,
    private readonly configService: ConfigService,
    private readonly authz: AuthzService
  ) {}
  @UseGuards(JwtAuthGuard)
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

  @UseGuards(JwtAuthGuard)
  @Get()
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
    const uploadedFiles = data.map(async (file) => {
      let serializedDta: Record<string, unknown>;
      try {
        serializedDta = JSON.parse(file.buffer.toString('utf8'));
      } catch {
        serializedDta = {originalResultsData: file.buffer.toString('utf8')};
      }

      // If the "user" is a group, we'll add the evaluation to the group, and ignore any other groups
      if (request.user instanceof Group) {
        const evaluation = await this.evaluationsService
          .create({
            // Only respect custom file names for single file uploads
            filename:
              data.length > 1
                ? file.originalname
                : createEvaluationDto.filename, // lgtm [js/type-confusion-through-parameter-tampering]
            evaluationTags: createEvaluationDto.evaluationTags || [],
            public: createEvaluationDto.public,
            data: serializedDta,
            groupId: request.user.id
          })
          .then(async (evaluation) => {
            const group = await this.groupsService.findByPkBang(
              request.user.id
            );
            this.groupsService.addEvaluationToGroup(group, evaluation);
            return evaluation;
          })
          .catch((err) => {
            throw new BadRequestException(err.message);
          });

        const createdDto = new EvaluationDto(evaluation, true);

        return _.omit(createdDto, 'data');
      } else {
        let groups: Group[] = createEvaluationDto.groups
          ? await this.groupsService.findByIds(createEvaluationDto.groups)
          : [];
        // Make sure the user can add evaluations to each group
        const abac = this.authz.abac.createForUser(request.user);
        groups = groups.filter((group) => {
          return abac.can(Action.AddEvaluation, group);
        });
        const evaluation = await this.evaluationsService
          .create({
            // Only respect custom file names for single file uploads
            filename:
              data.length > 1
                ? file.originalname
                : createEvaluationDto.filename, // lgtm [js/type-confusion-through-parameter-tampering]
            evaluationTags: createEvaluationDto.evaluationTags || [],
            public: createEvaluationDto.public,
            data: serializedDta,
            userId: request.user.id // Do not include userId on the DTO so we can set it automatically to the uploader's id.
          })
          .then((createdEvaluation) => {
            groups.forEach((group) =>
              this.groupsService.addEvaluationToGroup(group, createdEvaluation)
            );
            return createdEvaluation;
          });
        const createdDto: EvaluationDto = new EvaluationDto(
          evaluation,
          true,
          `${this.configService.get('EXTERNAL_URL') || ''}/results/${
            evaluation.id
          }`
        );
        return _.omit(createdDto, 'data');
      }
    });
    if (uploadedFiles.length === 1) {
      return uploadedFiles[0];
    }
    return Promise.all(uploadedFiles);
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
