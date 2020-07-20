import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {Evaluation} from './evaluation.model';
import {EvaluationDto} from './dto/evaluation.dto';
import {CreateEvaluationDto} from './dto/create-evaluation.dto';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation)
    private evaluationModel: typeof Evaluation
  ) {}


  async findAll(): Promise<EvaluationDto[]> {
    const evaluations = await this.evaluationModel.findAll<Evaluation>();
    return evaluations.map(evaluation => new EvaluationDto(evaluation));
  }

  async create(createEvaluationDto: CreateEvaluationDto): Promise<EvaluationDto> {
    const evaluation = new Evaluation();
    evaluation.version = createEvaluationDto.version;
    const evaluationData = await evaluation.save();
    return new EvaluationDto(evaluationData);
  }

  async update(id: number, updateEvaluationDto: UpdateEvaluationDto): Promise<EvaluationDto> {
    const evaluation = await this.evaluationModel.findByPk<Evaluation>(id);
    this.exists(evaluation);
    evaluation.update(updateEvaluationDto);
    evaluation.version = updateEvaluationDto.version || evaluation.version;
    const evaluationData = await evaluation.save();
    return new EvaluationDto(evaluationData);
  }

  async remove(id: number): Promise<EvaluationDto> {
    const evaluation = await this.evaluationModel.findByPk<Evaluation>(id);
    this.exists(evaluation);
    await evaluation.destroy();
    return new EvaluationDto(evaluation);
  }

  async findById(id: number): Promise<EvaluationDto> {
    const evaluation = await this.evaluationModel.findByPk<Evaluation>(id);
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
