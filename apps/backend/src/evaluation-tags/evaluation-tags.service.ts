import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {EvaluationTag} from './evaluation-tag.model';
import {EvaluationTagDto} from './dto/evaluation-tag.dto';
import {CreateEvaluationTagDto} from './dto/create-evaluation-tag.dto';
import {UpdateEvaluationTagDto} from './dto/update-evaluation-tag.dto';

@Injectable()
export class EvaluationTagsService {
  constructor(
    @InjectModel(EvaluationTag)
    private evaluationTagModel: typeof EvaluationTag
  ) {}

  async findAll(): Promise<EvaluationTagDto[]> {
    const evaluationTags = await this.evaluationTagModel.findAll<
      EvaluationTag
    >();
    return evaluationTags.map(
      evaluationTag => new EvaluationTagDto(evaluationTag)
    );
  }

  async create(
    evaluationId: number,
    createEvaluationTagDto: CreateEvaluationTagDto
  ): Promise<EvaluationTag> {
    const evaluationTag = new EvaluationTag();
    evaluationTag.key = createEvaluationTagDto.key;
    evaluationTag.value = createEvaluationTagDto.value;
    evaluationTag.evaluationId = evaluationId;
    return await evaluationTag.save();
  }

  async update(
    id: number,
    updateEvaluationTagDto: UpdateEvaluationTagDto
  ): Promise<EvaluationTagDto> {
    const evaluationTag = await EvaluationTag.findByPk<EvaluationTag>(id);
    this.exists(evaluationTag);
    evaluationTag.update(updateEvaluationTagDto);
    return new EvaluationTagDto(evaluationTag);
  }

  async remove(id: number): Promise<EvaluationTagDto> {
    const evaluationTag = await this.evaluationTagModel.findByPk<EvaluationTag>(
      id
    );
    this.exists(evaluationTag);
    await evaluationTag.destroy();
    return new EvaluationTagDto(evaluationTag);
  }

  objectFromDto(createEvaluationTagDto: CreateEvaluationTagDto): EvaluationTag {
    return new EvaluationTag(createEvaluationTagDto);
  }

  exists(evaluationTag: EvaluationTag): boolean {
    if (!evaluationTag) {
      throw new NotFoundException('EvaluationTag with given id not found');
    } else {
      return true;
    }
  }
}
