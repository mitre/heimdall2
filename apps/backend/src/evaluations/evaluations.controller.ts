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
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {UpdateICreateEvaluationInterceptor} from '../interceptors/convert-public-to-boolean.interceptor';
import {PublicBooleanPipe} from '../pipes/public-boolean.pipe';
import {User} from '../users/user.model';
import {CreateEvaluationDto} from './dto/create-evaluation.dto';
import {EvaluationDto} from './dto/evaluation.dto';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {EvaluationsService} from './evaluations.service';

@Controller('evaluations')
@UseGuards(JwtAuthGuard)
export class EvaluationsController {
  constructor(
    private evaluationsService: EvaluationsService,
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
  @UseInterceptors(UpdateICreateEvaluationInterceptor, FileInterceptor('data'))
  async create(
    @Body(new PublicBooleanPipe())
    createEvaluationDto: CreateEvaluationDto,
    @UploadedFile() data: Express.Multer.File,
    @Request() request: {user: User}
  ): Promise<EvaluationDto> {
    const serializedDta: JSON = JSON.parse(data.buffer.toString('utf8'));
    const updatedEvaluationDto: CreateEvaluationDto = {
      filename: createEvaluationDto.filename,
      evaluationTags: createEvaluationDto.evaluationTags || [],
      public: createEvaluationDto.public
    };
    return new EvaluationDto(
      // Do not include userId on the DTO so we can set it automatically to the uploader's id.
      await this.evaluationsService.create(
        updatedEvaluationDto,
        serializedDta,
        request.user.id
      )
    );
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
