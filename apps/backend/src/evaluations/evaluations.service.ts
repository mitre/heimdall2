import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {FindOptions} from 'sequelize/types';
import {DatabaseService} from '../database/database.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {CreateEvaluationDto} from './dto/create-evaluation.dto';
import {EvaluationDto} from './dto/evaluation.dto';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {Evaluation} from './evaluation.model';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation)
    private evaluationModel: typeof Evaluation,
    private databaseService: DatabaseService
  ) {}

  async findAll(): Promise<EvaluationDto[]> {
    const evaluations = await this.evaluationModel.findAll<Evaluation>({
      attributes: {exclude: ['data']},
      include: [EvaluationTag]
    });
    return evaluations.map((evaluation) => new EvaluationDto(evaluation));
  }

  async create(
    createEvaluationDto: CreateEvaluationDto
  ): Promise<EvaluationDto> {
    return new EvaluationDto(
      await Evaluation.create<Evaluation>(createEvaluationDto, {
        include: [EvaluationTag]
      })
    );
  }

  async update(
    id: string,
    updateEvaluationDto: UpdateEvaluationDto
  ): Promise<EvaluationDto> {
    const evaluation = await this.findByPkBang(id, {
      include: [EvaluationTag]
    });
    return new EvaluationDto(await evaluation.update(updateEvaluationDto));
  }

  async remove(id: string): Promise<EvaluationDto> {
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
    return new EvaluationDto(evaluation);
  }

  async findById(id: string): Promise<EvaluationDto> {
    const evaluation = await this.findByPkBang(id, {
      include: [EvaluationTag]
    });
    return new EvaluationDto(evaluation);
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
