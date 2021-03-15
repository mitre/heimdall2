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
import {GroupDto} from '../groups/dto/group.dto';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {CreateEvaluationInterceptor} from '../interceptors/create-evaluation-interceptor';
import {User} from '../users/user.model';
import {CreateEvaluationDto} from './dto/create-evaluation.dto';
import {EvaluationDto} from './dto/evaluation.dto';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {EvaluationsService} from './evaluations.service';

@Controller('evaluations')
@UseGuards(JwtAuthGuard)
export class EvaluationsController {
  constructor(
    private readonly evaluationsService: EvaluationsService,
    private readonly authz: AuthzService
  ) {}
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() request: {user: User}
  ): Promise<EvaluationDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const evaluation = await this.evaluationsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, evaluation);
    return new EvaluationDto(evaluation);
  }

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

  @Post()
  @UseInterceptors(FileInterceptor('data'), CreateEvaluationInterceptor)
  async create(
    @Body() createEvaluationDto: CreateEvaluationDto,
    @UploadedFile() data: Express.Multer.File,
    @Request() request: {user: User; headers: {origin: string}}
  ): Promise<EvaluationDto> {
    const serializedDta: JSON = JSON.parse(data.buffer.toString('utf8'));
    const updatedEvaluationDto: CreateEvaluationDto = {
      filename: createEvaluationDto.filename,
      evaluationTags: createEvaluationDto.evaluationTags || [],
      public: createEvaluationDto.public
    };
    // Do not include userId on the DTO so we can set it automatically to the uploader's id.
    const createdEvaluation = await this.evaluationsService.create(
      updatedEvaluationDto,
      serializedDta,
      request.user.id
    );
    const createdDto: EvaluationDto = new EvaluationDto(
      createdEvaluation,
      true,
      `${request.headers.origin}/results/${createdEvaluation.id}`
    );
    return _.omit(createdDto, 'data');
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() updateEvaluationDto: UpdateEvaluationDto
  ): Promise<EvaluationDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const evaluationToUpdate = await this.evaluationsService.findById(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Update, evaluationToUpdate);

    return new EvaluationDto(
      await this.evaluationsService.update(id, updateEvaluationDto)
    );
  }

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
