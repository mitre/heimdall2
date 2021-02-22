import {Controller, Get, Param, Req} from '@nestjs/common';
import {Request} from 'express';

@Controller('share')
export class ShareController {
  @Get(':id')
  async loadSharedEvaluation(
    @Req() req: Request,
    @Param('id') id: string
  ): Promise<void> {
    await this.setEvaluationCookies(req, id);
  }

  async setEvaluationCookies(
    req: Request,
    evaluationId: string
  ): Promise<void> {
    req.res?.cookie('loadEvaluation', evaluationId);
    req.res?.redirect('/');
  }
}
