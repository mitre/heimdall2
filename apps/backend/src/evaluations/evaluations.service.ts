import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {FindOptions, OrderItem} from 'sequelize/types';
import {DatabaseService} from '../database/database.service';
import {CreateEvaluationTagDto} from '../evaluation-tags/dto/create-evaluation-tag.dto';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {Evaluation} from './evaluation.model';
import {IEvalPaginationParams} from '@heimdall/interfaces';


@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation)
    private readonly evaluationModel: typeof Evaluation,
    private readonly databaseService: DatabaseService
  ) {}

  // async findAll(): Promise<Evaluation[]> {
  //   console.log("IN evaluation.services.ts findAll()")
  //   return this.evaluationModel.findAll<Evaluation>({
  //     attributes: {exclude: ['data']},
  //     include: [EvaluationTag, User, {model: Group, include: [User]}]
  //   });
  // }

  async findAll(params: IEvalPaginationParams): Promise<Evaluation[]> {
    console.log("IN evaluation.services.ts findAll()")
    console.log(`evaluations.services.ts -> params are ${params.limit}`)
    console.log(`evaluations.services.ts -> params are ${params.offset}`)
    console.log(`evaluations.services.ts -> params are \'${params.order[0].toString()}\'`)
    console.log(`evaluations.services.ts -> params are [[\'${params.order[0]}\',\'${params.order[1]}\']]`)
    console.log(`[[\'${params.order[0]}\',\'${params.order[1]}\']]`)

    return this.evaluationModel.findAll<Evaluation>({
      attributes: {exclude: ['data']},
      include: [EvaluationTag, User, {model: Group, include: [User]}],
      offset: params.offset,
      limit: params.limit,
      order: [[params.order[0],params.order[1]]]
    });
  }

  getPagination = (page: number, size: string | number) => {
    const limit = size ? +size : 10;
    const offset = page ? page * limit : 0;
  
    return { limit, offset };
  };

  async getPagingData(data: {rows: Evaluation;count: number;}, page: string | number, limit: number) {
    const { count: totalItems, rows: evaluations } = data;
    const currentPage = page ? +page : 0;
    const totalPages = Math.ceil(totalItems / limit);
  
    return { totalItems, evaluations, totalPages, currentPage };
  };


  // async findAndCountAll(params: IEvalPagination): Promise<Evaluation[]> {
  //   console.log("IN evaluation.services.ts findAndCountAll()")
  //   //const { page, size, title } = req.query;
  //   const { limit, offset } = this.getPagination(params.page, params.itemsPerPage);

  //   return this.evaluationModel.findAndCountAll({
  //     attributes: {exclude: ['data']},
  //     include: [EvaluationTag, User, {model: Group, include: [User]}],
  //     where: {
  //       [Op.or]: [
  //         {
  //           title: {
  //             [Op.like]: 'Boat%'
  //           }
  //         },
  //         {
  //           description: {
  //             [Op.like]: '%boat%'
  //           }
  //         }
  //       ]
  //     },
  //     offset: offset,
  //     limit: limit
  //   }).then(data => {
  //     const response = this.getPagingData(data, params.page, limit);
  //     return response;
  //   });
  // }

  async count(): Promise<number> {
    return this.evaluationModel.count();
  }

  async create(evaluation: {
    filename: string;
    evaluationTags: CreateEvaluationTagDto[] | undefined;
    public: boolean;
    data: unknown;
    userId?: string;
    groupId?: string;
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
      include: [EvaluationTag, User, Group, {model: Group, include: [User]}]
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
