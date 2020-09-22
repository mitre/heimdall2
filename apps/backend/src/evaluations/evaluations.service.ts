import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {Evaluation} from './evaluation.model';
import {EvaluationDto} from './dto/evaluation.dto';
import {CreateEvaluationDto} from './dto/create-evaluation.dto';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {DatabaseService} from '../database/database.service';
import {CreateEvaluationTagDto} from '../evaluation-tags/dto/create-evaluation-tag.dto';
import {UpdateEvaluationTagDto} from '../evaluation-tags/dto/update-evaluation-tag.dto';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation)
    private evaluationModel: typeof Evaluation,
    private evaluationTagsService: EvaluationTagsService,
    private databaseService: DatabaseService
  ) {}

  async findAll(): Promise<EvaluationDto[]> {
    const evaluations = await this.evaluationModel.findAll<Evaluation>({
      include: [EvaluationTag]
    });
    return evaluations.map(evaluation => new EvaluationDto(evaluation));
  }

  async create(
    createEvaluationDto: CreateEvaluationDto
  ): Promise<EvaluationDto> {
    const evaluation = new Evaluation();
    evaluation.version = createEvaluationDto.version;
    evaluation.data = createEvaluationDto.data;
    // Save the evaluation with no tags to get an ID.
    const evaluationData = await evaluation.save();
    const evaluationTagsPromises = createEvaluationDto?.evaluationTags?.map(
      async createEvaluationTagDto => {
        return this.evaluationTagsService.create(
          evaluationData.id,
          this.evaluationTagsService.objectFromDto(createEvaluationTagDto)
        );
      }
    );

    if (evaluationTagsPromises != undefined) {
      const evaluationTags = await Promise.all(evaluationTagsPromises);
      evaluationData.evaluationTags = evaluationTags;
    } else {
      evaluationData.evaluationTags = [];
    }
    return new EvaluationDto(await evaluationData.save());
  }

  async update(
    id: number,
    updateEvaluationDto: UpdateEvaluationDto
  ): Promise<EvaluationDto> {
    const evaluation = await this.evaluationModel.findByPk<Evaluation>(id, {
      include: [EvaluationTag]
    });
    this.exists(evaluation);

    if (updateEvaluationDto.data !== undefined) {
      evaluation.set('data', updateEvaluationDto.data);
    }

    if (updateEvaluationDto.version !== undefined) {
      evaluation.set('version', updateEvaluationDto.version);
    }

    if (updateEvaluationDto.evaluationTags !== undefined) {
      const evaluationTagsDelta = this.databaseService.getDelta(
        evaluation.evaluationTags,
        updateEvaluationDto.evaluationTags
      );

      const createTagPromises = evaluationTagsDelta.added.map(
        async evaluationTag => {
          return this.evaluationTagsService.create(
            evaluation.id,
            new CreateEvaluationTagDto(evaluationTag)
          );
        }
      );

      const updateTagPromises = evaluationTagsDelta.changed.map(
        async evaluationTag => {
          return this.evaluationTagsService.update(
            evaluationTag.id,
            new UpdateEvaluationTagDto(evaluationTag)
          );
        }
      );

      const deleteTagPromises = evaluationTagsDelta.deleted.map(
        async evaluationTag => {
          return this.evaluationTagsService.remove(evaluationTag.id);
        }
      );

      const createTags = await Promise.all(createTagPromises);
      const updateTags = await Promise.all(updateTagPromises);
      await Promise.all(deleteTagPromises);
      evaluation.set('evaluationTags', [...createTags, ...updateTags], {
        raw: true
      });
    }
    return new EvaluationDto(await evaluation.save());
  }

  async remove(id: number): Promise<EvaluationDto> {
    const evaluation = await this.evaluationModel.findByPk<Evaluation>(id, {
      include: [EvaluationTag]
    });
    this.exists(evaluation);
    await this.databaseService.sequelize.transaction(async transaction => {
      await Promise.all([
        evaluation.evaluationTags.map(async evaluationTag => {
          await evaluationTag.destroy({transaction});
        })
      ]);
      return evaluation.destroy({transaction});
    });
    return new EvaluationDto(evaluation);
  }

  async findById(id: number): Promise<EvaluationDto> {
    const evaluation = await this.evaluationModel.findByPk<Evaluation>(id, {
      include: [EvaluationTag]
    });
    this.exists(evaluation);
    return new EvaluationDto(evaluation);
  }

  exists(evaluation: Evaluation): boolean {
    if (!evaluation) {
      throw new NotFoundException('Evaluation with given id not found');
    } else {
      return true;
    }
  }
}
