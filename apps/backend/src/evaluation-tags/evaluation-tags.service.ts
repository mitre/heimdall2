import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {FindOptions} from 'sequelize/types';
import {Evaluation} from '../evaluations/evaluation.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {CreateEvaluationTagDto} from './dto/create-evaluation-tag.dto';
import {EvaluationTag} from './evaluation-tag.model';

@Injectable()
export class EvaluationTagsService {
  constructor(
    @InjectModel(EvaluationTag)
    private evaluationTagModel: typeof EvaluationTag
  ) {}

  async findAll(): Promise<EvaluationTag[]> {
    return this.evaluationTagModel.findAll<EvaluationTag>({
      include: [
        {
          model: Evaluation,
          include: [
            {
              model: Group,
              include: [User]
            }
          ]
        }
      ]
    });
  }

  async count(): Promise<number> {
    return this.evaluationTagModel.count();
  }

  async findById(id: string): Promise<EvaluationTag> {
    return this.findByPkBang(id, {
      include: [
        {
          model: Evaluation,
          include: [
            {
              model: Group,
              include: [User]
            }
          ]
        }
      ]
    });
  }

  async create(
    evaluationId: string,
    createEvaluationTagDto: CreateEvaluationTagDto
  ): Promise<EvaluationTag> {
    const evaluationTag = new EvaluationTag();
    evaluationTag.value = createEvaluationTagDto.value;
    evaluationTag.evaluationId = evaluationId;

    return evaluationTag.save();
  }

  async remove(id: string): Promise<EvaluationTag> {
    const evaluationTag = await this.findByPkBang(id, {
      include: [
        {
          model: Evaluation,
          include: [
            {
              model: Group,
              include: [User]
            }
          ]
        }
      ]
    });
    await evaluationTag.destroy();
    return evaluationTag;
  }

  async findByPkBang(
    identifier: string | number | Buffer | undefined,
    options: Pick<FindOptions, 'include'>
  ): Promise<EvaluationTag> {
    const evaluationTag = await this.evaluationTagModel.findByPk<EvaluationTag>(
      identifier,
      options
    );
    if (evaluationTag === null) {
      throw new NotFoundException('EvaluationTag with given id not found');
    } else {
      return evaluationTag;
    }
  }
}
