import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards
} from '@nestjs/common';
import {Request} from 'express';
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
    return this.evaluationsService.findById(id);
  }

  @Get('/share/:id')
  async loadSharedEvaluation(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<void> {
    this.setEvaluationCookies(req, id);
  }

  @Get()
  async findAll(): Promise<EvaluationDto[]> {
    return this.evaluationsService.findAll();
  }

  @Post()
  async create(
    @Body() createEvaluationDto: CreateEvaluationDto
  ): Promise<EvaluationDto> {
    return this.evaluationsService.create(createEvaluationDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEvaluationDto: UpdateEvaluationDto
  ): Promise<EvaluationDto> {
    return this.evaluationsService.update(id, updateEvaluationDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<EvaluationDto> {
    return this.evaluationsService.remove(id);
  }

  async setEvaluationCookies(
    req: Request,
    evaluationId: string
  ): Promise<void> {
    req.res?.cookie('loadEvaluation', evaluationId);
    req.res?.redirect('/');
  }
}
