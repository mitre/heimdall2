import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions } from 'sequelize';
import { Evaluation } from '../evaluations/evaluation.model';
import { Group } from '../groups/group.model';
import { User } from '../users/user.model';
import { CreateEvaluationTagDto } from './dto/create-evaluation-tag.dto';
import { EvaluationTag } from './evaluation-tag.model';

@Injectable()
export class EvaluationTagsService {
  constructor(
    @InjectModel(EvaluationTag)
    private readonly evaluationTagModel: typeof EvaluationTag,
  ) {}

  async count(): Promise<number> {
    return this.evaluationTagModel.count();
  }

  async create(
    evaluationId: string,
    createEvaluationTagDto: CreateEvaluationTagDto,
  ): Promise<EvaluationTag> {
    const evaluationTag = new EvaluationTag();
    evaluationTag.value = createEvaluationTagDto.value;
    evaluationTag.evaluationId = evaluationId;
    return evaluationTag.save();
  }

  async findAll(): Promise<EvaluationTag[]> {
    return this.evaluationTagModel.findAll<EvaluationTag>({
      include: [
        {
          include: [
            {
              include: [User],
              model: Group,
            },
          ],
          model: Evaluation,
        },
      ],
    });
  }

  async findById(id: string): Promise<EvaluationTag> {
    return this.findByPkBang(id, {
      include: [
        {
          include: [
            {
              include: [User],
              model: Group,
            },
          ],
          model: Evaluation,
        },
      ],
    });
  }

  async findByPkBang(
    identifier: Buffer | number | string | undefined,
    options: Pick<FindOptions, 'include'>,
  ): Promise<EvaluationTag> {
    const evaluationTag = await this.evaluationTagModel.findByPk<EvaluationTag>(
      identifier,
      options,
    );
    if (evaluationTag === null) {
      throw new NotFoundException('EvaluationTag with given id not found');
    } else {
      return evaluationTag;
    }
  }

  async remove(id: string): Promise<EvaluationTag> {
    const evaluationTag = await this.findByPkBang(id, {
      include: [
        {
          include: [
            {
              include: [User],
              model: Group,
            },
          ],
          model: Evaluation,
        },
      ],
    });
    await evaluationTag.destroy();
    return evaluationTag;
  }
}
