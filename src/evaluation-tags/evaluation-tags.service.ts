import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {EvaluationTag} from './evaluation-tag.model';
import {EvaluationTagDto} from './dto/evaluation-tag.dto';

@Injectable()
export class EvaluationTagsService {
  constructor(@InjectModel(EvaluationTag)
    private evaluationTagModel: typeof EvaluationTag
  ) {}
  async findAll(): Promise<EvaluationTagDto[]> {
    const evaluationTags = await this.evaluationTagModel.findAll<EvaluationTag>();
    return evaluationTags.map(evaluationTag => new EvaluationTagDto(evaluationTag));
  }

  async remove(id: number) {
    const evaluationTag = await this.evaluationTagModel.findByPk<EvaluationTag>(id);
    this.exists(evaluationTag);
    await evaluationTag.destroy();
    return new EvaluationTagDto(evaluationTag);
  }

  exists(evaluationTag: EvaluationTag): boolean {
    if (!evaluationTag) {
      throw new NotFoundException('EvaluationTag with given id not found');
    } else {
      return true;
    }
  }
}
