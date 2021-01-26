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
import {CreateEvaluationDto} from './dto/create-evaluation.dto';
import {EvaluationDto} from './dto/evaluation.dto';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {EvaluationsService} from './evaluations.service';

@Controller('evaluations')
@UseGuards(JwtAuthGuard)
export class EvaluationsController {
  constructor(private evaluationsService: EvaluationsService) {}
  @Get(':id')
  async findById(@Param('id') id: string): Promise<EvaluationDto> {
    return new EvaluationDto(await this.evaluationsService.findById(id));
  }

  @Get()
  async findAll(): Promise<EvaluationDto[]> {
    const evaluations = await this.evaluationsService.findAll();
    return evaluations.map((evaluation) => new EvaluationDto(evaluation));
  }

  @Post()
  async create(
    @Body() createEvaluationDto: CreateEvaluationDto
  ): Promise<EvaluationDto> {
    return new EvaluationDto(
      await this.evaluationsService.create(createEvaluationDto)
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEvaluationDto: UpdateEvaluationDto
  ): Promise<EvaluationDto> {
    return new EvaluationDto(
      await this.evaluationsService.update(id, updateEvaluationDto)
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<EvaluationDto> {
    return new EvaluationDto(await this.evaluationsService.remove(id));
  }
}
