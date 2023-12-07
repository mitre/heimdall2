import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {FindOptions, Op } from 'sequelize';
import {DatabaseService} from '../database/database.service';
import {CreateEvaluationTagDto} from '../evaluation-tags/dto/create-evaluation-tag.dto';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {Evaluation} from './evaluation.model';
import {IEvalPaginationParams} from '@heimdall/interfaces';
import {IEvaluationResponse} from './dto/evaluation.dto';


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

  async getAllEvaluations(params: IEvalPaginationParams): Promise<{
    totalItems: number;
    evaluations: Evaluation[];
  }> {
    console.log("IN evaluation.services.ts getAllEvaluations()")
    console.log(`evaluations.services.ts -> params are ${params.limit}`)
    console.log(`evaluations.services.ts -> params are ${params.offset}`)
    console.log(`evaluations.services.ts -> params are \'${params.order[0].toString()}\'`)
    console.log(`evaluations.services.ts -> params are [[\'${params.order[0]}\',\'${params.order[1]}\']]`)
    console.log(`[[\'${params.order[0]}\',\'${params.order[1]}\']]`)

    // return this.evaluationModel.findAll<Evaluation>({
    //   attributes: {exclude: ['data']},
    //   include: [EvaluationTag, User, {model: Group, include: [User]}],
    //   offset: params.offset,
    //   limit: params.limit,
    //   order: [[params.order[0],params.order[1]]]
    // });
    // offset: the value where to start the returning values
    // limit:  the number of records to return
    const response = this.evaluationModel.findAndCountAll<Evaluation>(
      {
        attributes: {exclude: ['data']},
        include: [EvaluationTag, User, {model: Group, include: [User]}],
        offset: params.offset,
        limit: params.limit,
        order: [[params.order[0],params.order[1]]]
      }
    )
    .then(data => {
      const { count: totalItems, rows: evaluations } = data;
      console.log(`totalItems is: ${totalItems}`)
      return  { totalItems, evaluations };
    });
    // .catch(err => {
    //   return {
    //     message:
    //       err.message || "Some error occurred while retrieving evaluations."
    //   };
    // });

    return response;
  }

  async getEvaluationsWithClause(params: IEvalPaginationParams): Promise<{
    totalItems: number;
    evaluations: Evaluation[];
  }> {
    console.log("IN evaluation.services.ts getEvaluationsWithClause()")
    console.log(`evaluations.services.ts -> params are ${params.limit}`)
    console.log(`evaluations.services.ts -> params are ${params.offset}`)
    console.log(`evaluations.services.ts -> params are \'${params.order[0].toString()}\'`)
    console.log(`evaluations.services.ts -> params are [[\'${params.order[0]}\',\'${params.order[1]}\']]`)
    console.log(`[[\'${params.order[0]}\',\'${params.order[1]}\']]`)
    console.log(`[[\'${params.fields![0]}\',\'${params.fields![1]}\']]`)

  let response: Promise<{
    totalItems: number;
    evaluations: Evaluation[];
  }>
  
  if (params.operator == 'or') {
    response = this.evaluationModel.findAndCountAll<Evaluation>(
      {
        attributes: {exclude: ['data']},
        include: [
          {model: EvaluationTag, as: 'evaluationTags'},
          User,
          {model: Group, as: 'groups', include: [User]}],
        where: {
          [Op.or]: [
            {
              'filename': {
                [Op.like]: `%${params.fields![0]}%`
              }
            },
            {
              '$groups.name$': {
                [Op.like]: `%${params.fields![1]}%`
              }
            },
            {
              '$evaluationTags.value$': {
                [Op.like]: `%${params.fields![2]}%`
              }
            }
          ]
        },
        offset: params.offset,
        limit: params.limit,
        order: [[params.order[0],params.order[1]]]
      }
    )
    .then(data => {
      const { count: totalItems, rows: evaluations } = data;
      console.log(`totalItems is: ${totalItems}`)
      return  { totalItems, evaluations };
    });
  } else {
    response = this.evaluationModel.findAndCountAll<Evaluation>(
      {
        attributes: {exclude: ['data']},
        include: [EvaluationTag, User, {model: Group, include: [User]}],
        where: {
          [Op.and]: [
            {
              'Evaluation.filename': {
                [Op.like]: `%${params.fields![0]}%`
              }
            },
            {
              'groups.name': {
                [Op.like]: `%${params.fields![1]}%`
              }
            },
            {
              'evaluationTags.value': {
                [Op.like]: `%${params.fields![2]}%`
              }
            }
          ]
        },
        offset: params.offset,
        limit: params.limit,
        order: [[params.order[0],params.order[1]]]

      }
    )
    .then(data => {
      const { count: totalItems, rows: evaluations } = data;
      console.log(`totalItems is: ${totalItems}`)
      return  { totalItems, evaluations };
    });
  }


  return response;
}

  // getPagination = (page: number, size: string | number) => {
  //   const limit = size ? +size : 10;
  //   const offset = page ? page * limit : 0;
  
  //   return { limit, offset };
  // };

  // async getPagingData(data: IEvaluationResponse, page: string | number, limit: number) {
  //   const { totalItems, evaluations } = data;
  //   const currentPage = page ? +page : 0;
  //   const totalPages = Math.ceil(totalItems / limit);
  
  //   return { totalItems, evaluations };
  // };


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
