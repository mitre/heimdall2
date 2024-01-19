import {IEvalPaginationParams} from '@heimdall/common/interfaces';
import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {FindOptions, Op, WhereOptions} from 'sequelize';
import {DatabaseService} from '../database/database.service';
import {CreateEvaluationTagDto} from '../evaluation-tags/dto/create-evaluation-tag.dto';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {UpdateEvaluationDto} from './dto/update-evaluation.dto';
import {Evaluation} from './evaluation.model';

interface EvaluationsResponse {
  totalItems: number;
  evaluations: Evaluation[];
}

interface WhereClauseParams {
  searchFields: string[];
  operator: string;
  email: string;
  role: string;
  action: string;
}
@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation)
    private readonly evaluationModel: typeof Evaluation,
    private readonly databaseService: DatabaseService
  ) {}

  async findAll(): Promise<Evaluation[]> {
    return this.evaluationModel.findAll<Evaluation>({
      attributes: {exclude: ['data']},
      include: [EvaluationTag, User, {model: Group, include: [User]}]
    });
  }

  /*
    NOTES: These notes are about the getAllEvaluations() and the 
           getEvaluationsWithClause() methods

    1: The sequelize model is using eager loading, at the SQL level, this is a
       query with one or more joins. This is done by using the include option
       on a model finder query (findAll). Given that we are using multiple JOIN
       operations, particularly the ones on the Tags and Groups, if a record has
       multiple Tags or a Group with multiple members, the query will return
       a json object where each evaluation may contain multiple rows one per
       Tag or group. This offsets the LIMIT because the return data is in JSON
       format where the tags and groups are objects within the scan id, but are
       processed as individual SQL records, resulting in an inaccurate number
       of records returned.

       For this reason the pagination is not done where query the records but
       rather by getting all records and slicing the appropriate number of
       records based on the pagination parameters (LIMIT and OFFSET)

    2: TypeScript is not able to infer OrderItem[].

       The 'order' option in sequelize is defined as type OrderItem like: 
         string | fn | col | literal | [string | col | fn | literal, string] |
         [Model<any, any> | { model: Model<any, any>, as: string }, string, string] |
         [Model<any, any>, Model<any, any>, string, string]

       When using TypeScript the order variable is of type string[], which is not
       supported by OrderItem. The only way to avoid it is to add string[] to the
       list of accepted types in OrderItem.

       Hence the reason the order option is being initialized with array indices.

    3: Not using sequelize findAndCountAll method because the count returned is
       for all records found which includes multiple entries (due to JOIN) for
       each record if evaluations have multiple Groups that belong to different
       users.

       Using the findAll and calling specific queries to determine the total records.

    4: Using ORDER BY on top-level and nested columns, for that reason we need 
       to reference nested columns by utilizing the '$nested.column$' syntax.
       For that reason the params.order array can have 2 or 3 indices as
       listed bellow.

       params.order values are as follows () represent index):
       length       (0)           (1)               (2)
         2      field name  order (asc/desc)
         3      table name  field name         order (asc/desc)

  */

  /*
    NOTE: Hack to overcome the inability to retrieve the desire
          number of evaluation (see note 1 above). Pad the 
          requested number of records by an estimated number of
          group members (20 per group).
  */
  totalGroupMembers = 20;

  async getAllEvaluations(
    params: IEvalPaginationParams,
    email: string,
    role: string
  ): Promise<EvaluationsResponse> {
    const queryResponse: EvaluationsResponse = {
      totalItems: 0,
      evaluations: []
    };
    const whereClause = this.getWhereClauseAll(role, email);

    await this.evaluationModel
      .findAll<Evaluation>({
        attributes: {exclude: ['data']},
        include: [EvaluationTag, User, {model: Group, include: [User]}],
        offset: params.offset,
        limit: Number(params.limit) * this.totalGroupMembers,
        order:
          params.order.length == 2
            ? [[params.order[0], params.order[1]]]
            : [[params.order[0], params.order[1], params.order[2]]],
        subQuery: false,
        where: whereClause
      })
      .then(async (data) => {
        const totalItems = await this.evaluationCount(email, role);

        const totalPages = Math.ceil(totalItems / params.limit);
        const totalReturned = Number(params.offset) + Number(params.limit);
        const onPage = Math.ceil(
          totalReturned / 100 / (Number(params.limit) / 100)
        );
        if (onPage == totalPages) {
          const returnCnt = totalItems - Number(params.offset);
          // Return from the back of the array
          queryResponse.evaluations = data.slice(-returnCnt);
        } else {
          queryResponse.evaluations = data.slice(0, params.limit);
        }
        queryResponse.totalItems = totalItems;
      });
    return queryResponse;
  }

  async getEvaluationsWithClause(
    params: IEvalPaginationParams,
    email: string,
    role: string
  ): Promise<EvaluationsResponse> {
    const queryResponse: EvaluationsResponse = {
      totalItems: 0,
      evaluations: []
    };

    const whereClauseParams: WhereClauseParams = {
      searchFields:
        params.searchFields == undefined ? [''] : params.searchFields,
      operator: params.operator == undefined ? 'OR' : params.operator,
      email: email,
      role: role,
      action: 'search'
    };

    const whereClause = await this.getWhereClauseSearch(
      whereClauseParams.searchFields,
      whereClauseParams.operator,
      whereClauseParams.email,
      whereClauseParams.role,
      whereClauseParams.action
    );
    await this.evaluationModel
      .findAll<Evaluation>({
        attributes: {exclude: ['data']},
        include: [EvaluationTag, User, {model: Group, include: [User]}],
        offset: params.offset,
        limit: Number(params.limit) * this.totalGroupMembers,
        order:
          params.order.length == 2
            ? [[params.order[0], params.order[1]]]
            : [[params.order[0], params.order[1], params.order[2]]],
        subQuery: false,
        where: whereClause
      })
      .then(async (data) => {
        const totalItems = await this.searchItemsCount(whereClauseParams);

        const totalPages = Math.ceil(totalItems / params.limit);
        const totalReturned = Number(params.offset) + Number(params.limit);
        const onPage = Math.ceil(
          totalReturned / 100 / (Number(params.limit) / 100)
        );
        if (onPage == totalPages) {
          const returnCnt = totalItems - Number(params.offset);
          // Return from the back of the array
          queryResponse.evaluations = data.slice(-returnCnt);
        } else {
          queryResponse.evaluations = data.slice(0, params.limit);
        }
        queryResponse.totalItems = totalItems;
      });

    return queryResponse;
  }

  getWhereClauseAll(role: string, email: string): WhereOptions {
    const whereClause = this.getWhereClauseBaseCriteria(role, email);
    return {[Op.or]: whereClause};
  }

  getWhereClauseBaseCriteria(role: string, email: string): WhereOptions {
    const baseCriteria = [];
    baseCriteria.push({public: {[Op.eq]: 'true'}});
    if (role == 'admin') {
      baseCriteria.push({public: {[Op.eq]: 'false'}});
    } else {
      baseCriteria.push({'$user.email$': {[Op.like]: `${email}`}});
    }
    return baseCriteria;
  }

  async getWhereClauseSearch(
    fields: string[],
    operation: string,
    email: string,
    role: string,
    action: string
  ): Promise<WhereOptions> {
    const searchFields = [];
    const baseCriteria = this.getWhereClauseBaseCriteria(role, email);

    if (fields[0] != '()') {
      searchFields.push({filename: {[Op.iRegexp]: `${fields[0]}`}});
    }
    if (fields[1] != '()') {
      searchFields.push({'$groups.name$': {[Op.iRegexp]: `${fields[1]}`}});
    }
    if (fields[2] != '()') {
      if (action == 'count') {
        searchFields.push({
          '$evaluationTags.value$': {[Op.iRegexp]: `${fields[2]}`}
        });
      } else {
        const evaluationIds = await this.getEvaluationId(fields[2]);

        searchFields.push({
          [Op.or]: [
            {id: {[Op.in]: evaluationIds}},
            {'$evaluationTags.value$': {[Op.iRegexp]: `${fields[2]}`}}
          ]
        });
      }
    }

    if (operation == 'AND') {
      // Expected outcome: an OR baseCriteria AND an AND searchFields
      return {[Op.or]: baseCriteria, [Op.and]: searchFields};
    } else {
      // Expected outcome: an OR baseCriteria AND an OR searchFields
      return {
        [Op.and]: [{[Op.or]: baseCriteria}, {[Op.and]: {[Op.or]: searchFields}}]
      };
    }
  }

  async getEvaluationId(tagValue: string): Promise<string[]> {
    let evaluationIds: string[] = [];
    await EvaluationTag.findAll({
      attributes: ['evaluationId'],
      where: {value: {[Op.iRegexp]: tagValue}},
      raw: true
    }).then(async (evalIds) => {
      evaluationIds = evalIds.map((evalIds) => evalIds.evaluationId);
    });
    return evaluationIds;
  }

  async evaluationCount(userEmail: string, role: string): Promise<number> {
    if (role == 'admin') {
      return this.evaluationModel.count();
    } else {
      return this.evaluationModel.count({
        include: User,
        where: {
          [Op.or]: [
            {public: {[Op.eq]: 'true'}},
            {'$user.email$': {[Op.like]: `${userEmail}`}}
          ]
        },
        distinct: true,
        col: 'id'
      });
    }
  }

  async searchItemsCount(
    whereClauseParams: WhereClauseParams
  ): Promise<number> {
    const whereClause = await this.getWhereClauseSearch(
      whereClauseParams.searchFields,
      whereClauseParams.operator,
      whereClauseParams.email,
      whereClauseParams.role,
      'count'
    );
    return this.evaluationModel.count({
      include: [EvaluationTag, User, Group],
      where: whereClause,
      distinct: true,
      col: 'id'
    });
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
