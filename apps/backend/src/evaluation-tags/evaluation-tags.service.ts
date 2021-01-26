import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {CreateEvaluationTagDto} from './dto/create-evaluation-tag.dto';
import {UpdateEvaluationTagDto} from './dto/update-evaluation-tag.dto';
import {EvaluationTag} from './evaluation-tag.model';

@Injectable()
export class EvaluationTagsService {
  constructor(
    @InjectModel(EvaluationTag)
    private evaluationTagModel: typeof EvaluationTag
  ) {}

  async findAll(): Promise<EvaluationTag[]> {
    return this.evaluationTagModel.findAll<EvaluationTag>();
  }

  async findById(id: string): Promise<EvaluationTag> {
    return this.findByPkBang(id);
  }

  async create(
    evaluationId: string,
    createEvaluationTagDto: CreateEvaluationTagDto
  ): Promise<EvaluationTag> {
    const evaluationTag = new EvaluationTag();
    evaluationTag.key = createEvaluationTagDto.key;
    evaluationTag.value = createEvaluationTagDto.value;
    evaluationTag.evaluationId = evaluationId;
    return evaluationTag.save();
  }

  async update(
    id: string,
    updateEvaluationTagDto: UpdateEvaluationTagDto
  ): Promise<EvaluationTag> {
    const evaluationTag = await this.findByPkBang(id);
    return evaluationTag.update(updateEvaluationTagDto);
  }

  async remove(id: string): Promise<EvaluationTag> {
    const evaluationTag = await this.findByPkBang(id);
    await evaluationTag.destroy();
    return evaluationTag;
  }

  objectFromDto(createEvaluationTagDto: CreateEvaluationTagDto): EvaluationTag {
    return new EvaluationTag(createEvaluationTagDto);
  }

  async findByPkBang(
    identifier: string | number | Buffer | undefined
  ): Promise<EvaluationTag> {
    const evaluationTag = await EvaluationTag.findByPk<EvaluationTag>(
      identifier
    );
    if (evaluationTag === null) {
      throw new NotFoundException('EvaluationTag with given id not found');
    } else {
      return evaluationTag;
    }
  }
}
