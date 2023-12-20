import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {FindOptions, Op} from 'sequelize';
import {DatabaseService} from '../database/database.service';
import {CreateEvaluationTagDto} from '../evaluation-tags/dto/create-evaluation-tag.dto';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {Evaluation} from './evaluation.model';
import {IEvalPaginationParams} from '@heimdall/interfaces';
import sequelize from 'sequelize';

interface EvaluationsResponse {
  totalItems: number;
  evaluations: Evaluation[];
}
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

  async getAllEvaluations(params: IEvalPaginationParams): Promise<EvaluationsResponse> {
    console.log("-----IN evaluation.services.ts getAllEvaluations()")
    // console.log(`evaluations.services.ts -> params are ${params.limit}`)
    // console.log(`evaluations.services.ts -> params are ${params.offset}`)
    // console.log(`evaluations.services.ts -> params are \'${params.order[0].toString()}\'`)
    // console.log(`evaluations.services.ts -> params are [[\'${params.order[0]}\',\'${params.order[1]}\']]`)
    // console.log(`${params.order[0]} ${params.order[1]} ${params.order[2]}`)
    // console.log(`evaluations.services.ts -> params are ${params.order}`)

    /*
      TypeScript is not able to infer OrderItem[].

      The 'order' option in sequelize is defined as type OrderItem like: 
        string | fn | col | literal | [string | col | fn | literal, string] |
        [Model<any, any> | { model: Model<any, any>, as: string }, string, string] |
        [Model<any, any>, Model<any, any>, string, string]

      When using TypeScript the order variable is of type string[], which is not
      supported by OrderItem. The only way to avoid it is to add string[] to the
      list of accepted types in OrderItem.

      Hence the reason the order option is being initialized with array indices.
    */
    const responseEvals: EvaluationsResponse = {
      totalItems: 0,
      evaluations: []
    };
    /*
      Not using sequelize findAndCountAll method because the count returned 
      is for all records found which includes multiple entries for each 
      record if evaluations have multiple Groups that belong to different users.
      
      Using the findAll and calling the Evaluations for the total records.

      params.order values are as follows:
      length       (0)           (1)               (3)
        2      field name  order (asc/desc)
        3      table name  field name         order (asc/desc) 
    */

    //const response = this.evaluationModel.findAndCountAll<Evaluation>(
    await this.evaluationModel.findAll<Evaluation>(
      {
        attributes: {exclude: ['data']},
        include: [EvaluationTag, User, {model: Group, include: [User]}],
        offset: params.offset,
        limit: params.limit,
        order: (params.order.length == 2) ? 
           [[params.order[0], params.order[1]]] :
           [[params.order[0], params.order[1], params.order[2]]]
      }
    ).then(async data => {
      //let { count: totalItems, rows: evaluations } = data;
      //console.log(`totalItems (1) is: ${totalItems}`)
      /*
        The count being returned is for the total queried items.
        We need the total evaluations count, hence this.count().
      */
      let totalItems = await this.count();
      console.log(`totalItems (2) is: ${totalItems}`)
      responseEvals.evaluations = data;
      responseEvals.totalItems = totalItems;
      //return  { totalItems, evaluations };
      //return responseEvals;
    });
    console.log("-----OUT evaluation.services.ts getAllEvaluations()")
    return responseEvals;
  }

  async getEvaluationsWithClause(params: IEvalPaginationParams): Promise<EvaluationsResponse> {
    console.log("---IN evaluation.services.ts getEvaluationsWithClause()")
    console.log(`evaluations.services.ts -> params limit: ${params.limit}`)
    console.log(`evaluations.services.ts -> params offset: ${params.offset}`)
    // console.log(`evaluations.services.ts -> params are \'${params.order[0].toString()}\'`)
    // console.log(`evaluations.services.ts -> params are [[\'${params.order[0]}\',\'${params.order[1]}\']]`)
    console.log(`evaluations.services.ts -> params order: ${params.order}`)
    console.log(`evaluations.services.ts -> params operator: ${params.operator}`)
    console.log(`evaluations.services.ts -> params fields: ${params.fields}`)
    console.log(`[[\'${params.order[0]}\',\'${params.order[1]}\']]`)
    console.log(`[[\'${params.fields![0]}\',\'${params.fields![1]}\',\'${params.fields![2]}\']]`)

  let response: Promise<EvaluationsResponse>;

  //params.fields![0] = "(web)|(xray)";
  if (params.operator == 'OR') {
    const tagClause = (params.fields![2] == '') ? 
                        (`$evaluationTags.value$ isnull`) :
                        (`{[Op.iRegexp]: ${params.fields![2]}}`);
    response = this.evaluationModel.findAndCountAll<Evaluation>(
      {
        attributes: {exclude: ['data']},
        include: [EvaluationTag,  User, 
          {model: Group, 
            where:{
              [Op.or]: [ {'name': { [Op.iRegexp]: `${params.fields![1]}` } } ]
            },  
            include: [User]}],
        offset: params.offset,
        limit: params.limit,
        order: (params.order.length == 2) ? 
           [[params.order[0], params.order[1]]] :
           [[params.order[0], params.order[1], params.order[2]]]
      }
    ).then(data => {
      const { count: totalItems, rows: evaluations } = data;
      console.log(`totalItems is: ${totalItems}`)
      return  { totalItems, evaluations };
    });
  } else {
    // [Op.is]: sequelize.literal('IS NOT NULL')
    // let filenameOp = sequelize.literal(`[Op.iRegexp]: ${params.fields![0]}`);
    // if (params.fields![0] == '') {
    //   filenameOp = sequelize.literal(`[Op.is]: sequelize.literal('NOT NULL')`)
    // }
    //const filenameOp = { (params.fields![0] == '') ? `{sequelize.literal([Op.is]: NOT NULL)}` : `{[Op.iRegexp]: ${params.fields![0]}}` };
    response = this.evaluationModel.findAndCountAll<Evaluation>(
      {
        subQuery: false, //use JOIN/LEFT JOIN tables themselves instead of join subqueries
        attributes: {exclude: ['data']},
        include: [EvaluationTag, User, {model: Group, include: [User]}],
        offset: params.offset,
        limit: params.limit,
        order: (params.order.length == 2) ? 
          [[params.order[0], params.order[1]]] :
          [[params.order[0], params.order[1], params.order[2]]],
        where: {
          [Op.and]: [
            // {
            //   [Op.or]: [
            //     { 'filename': { [Op.iRegexp]: `${params.fields![0]}` } },
            //     { 'filename': { [Op.is]: sequelize.literal('NOT NULL') } }
            //   ]
            // },
            // {
            //   [Op.or]: [
            //     { '$groups.name$': { [Op.iRegexp]: `${params.fields![1]}` } },
            //     { '$groups.name$': { [Op.is]: sequelize.literal('NULL') } }
            //   ]
            // },
            { 'filename': { [Op.iRegexp]: `${params.fields![0]}` } },
            { '$groups.name$': { [Op.iRegexp]: `${params.fields![1]}` } },
            { '$evaluationTags.value$': { [Op.iRegexp]: `${params.fields![2]}` } }
          ]
        }          
      }
    ).then(data => {
      const { count: totalItems, rows: evaluations } = data;
      console.log(`totalItems is: ${totalItems}`)
      return  { totalItems, evaluations };
    });
  }
  return response;
}

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
