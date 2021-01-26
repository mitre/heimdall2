import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {CreateEvaluationTagDto} from './dto/create-evaluation-tag.dto';
import {EvaluationTagDto} from './dto/evaluation-tag.dto';
import {UpdateEvaluationTagDto} from './dto/update-evaluation-tag.dto';
import {EvaluationTagsService} from './evaluation-tags.service';

@Controller('evaluation-tags')
@UseGuards(JwtAuthGuard)
export class EvaluationTagsController {
  constructor(private evaluationTagsService: EvaluationTagsService) {}
  @Get()
  async index(): Promise<EvaluationTagDto[]> {
    const evaluationTags = await this.evaluationTagsService.findAll();
    return evaluationTags.map(
      (evaluationTag) => new EvaluationTagDto(evaluationTag)
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<EvaluationTagDto> {
    return new EvaluationTagDto(await this.evaluationTagsService.findById(id));
  }

  @Post()
  async create(
    @Param('evaluationId') evaluationId: string,
    @Body() createEvaluationTagDto: CreateEvaluationTagDto
  ): Promise<EvaluationTagDto> {
    return new EvaluationTagDto(
      await this.evaluationTagsService.create(
        evaluationId,
        createEvaluationTagDto
      )
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEvaluationTagDto: UpdateEvaluationTagDto
  ): Promise<EvaluationTagDto> {
    return new EvaluationTagDto(
      await this.evaluationTagsService.update(id, updateEvaluationTagDto)
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<EvaluationTagDto> {
    return new EvaluationTagDto(await this.evaluationTagsService.remove(id));
  }
}
