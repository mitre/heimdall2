import {ForbiddenError} from '@casl/ability';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
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
  @UseInterceptors(FileInterceptor('data'), CreateEvaluationInterceptor)
  async create(
    @Body() createEvaluationDto: CreateEvaluationDto,
    @UploadedFile() data: Express.Multer.File,
    @Request() request: {user: User}
  ): Promise<EvaluationDto> {
    const serializedDta: JSON = JSON.parse(data.buffer.toString('utf8'));
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
        filename: createEvaluationDto.filename,
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
      `${this.configService.get('EXTERNAL_URL') || ''}/results/${evaluation.id}`
    );
    return _.omit(createdDto, 'data');
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
