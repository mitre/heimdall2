import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {FindOptions} from 'sequelize/types';
import {DatabaseService} from '../database/database.service';
import {CreateEvaluationTagDto} from '../evaluation-tags/dto/create-evaluation-tag.dto';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {Evaluation} from './evaluation.model';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation)
    private evaluationModel: typeof Evaluation,
    private databaseService: DatabaseService
  ) {}

  async findAll(): Promise<Evaluation[]> {
    return this.evaluationModel.findAll<Evaluation>({
      attributes: {exclude: ['data']},
      include: [EvaluationTag, User, {model: Group, include: [User]}]
    });
  }

  async count(): Promise<number> {
    return this.evaluationModel.count();
  }

  async create(evaluation: {
    filename: string;
    evaluationTags: CreateEvaluationTagDto[];
    public: boolean;
    data: unknown;
    userId: string;
  }): Promise<Evaluation> {
    return Evaluation.create<Evaluation>(
      {
        ...evaluation
      },
      {
        include: [EvaluationTag]
      }
    );
  }

  async update(
    id: string,
    updateEvaluationDto: UpdateEvaluationDto
  ): Promise<Evaluation> {
    const evaluation = await this.findByPkBang(id, {
      include: [EvaluationTag]
    });
    return evaluation.update(updateEvaluationDto);
  }

  async remove(id: string): Promise<Evaluation> {
    const evaluation = await this.findByPkBang(id, {
      include: [EvaluationTag]
    });
    await this.databaseService.sequelize.transaction(async (transaction) => {
      if (evaluation.evaluationTags !== null) {
        await Promise.all([
          evaluation.evaluationTags.map(async (evaluationTag) => {
            await evaluationTag.destroy({transaction});
          })
        ]);
      }
      return evaluation.destroy({transaction});
    });
    return evaluation;
  }

  async findById(id: string): Promise<Evaluation> {
    return this.findByPkBang(id, {
      include: [EvaluationTag, User, {model: Group, include: [User]}]
    });
  }

  async groups(id: string): Promise<Group[]> {
    return (
      await this.findByPkBang(id, {include: {model: Group, include: [User]}})
    ).groups;
  }

  async findByPkBang(
    identifier: string | number | Buffer | undefined,
    options: Pick<FindOptions, 'include'>
  ): Promise<Evaluation> {
    const evaluation = await this.evaluationModel.findByPk<Evaluation>(
      identifier,
      options
    );
    if (evaluation === null) {
      throw new NotFoundException('Evaluation with given id not found');
    } else {
      return evaluation;
    }
  }
}
