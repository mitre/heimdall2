import {Controller, UseGuards, Get} from '@nestjs/common';
import {EvaluationTagsService} from './evaluation-tags.service';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {EvaluationTagDto} from './dto/evaluation-tag.dto';

@Controller('evaluation-tags')
export class EvaluationTagsController {
  constructor(private evaluationTagsService: EvaluationTagsService) {}
  @UseGuards(JwtAuthGuard)
  @Get()
  async index(): Promise<EvaluationTagDto[]> {
    return this.evaluationTagsService.findAll();
  }
}
