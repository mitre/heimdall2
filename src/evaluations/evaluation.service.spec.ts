import {Test} from '@nestjs/testing';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {EvaluationTag} from '../evaluation-tags/evaluation-tag.model';
import {SequelizeModule} from '@nestjs/sequelize';
import {Evaluation} from './evaluation.model';
import {EvaluationsService} from './evaluations.service';
import {EVALUATION_1} from '../../test/constants/evaluations-test.constant';

describe('EvaluationTagsService', () => {
  let evaluationTagsService: EvaluationTagsService;
  let evaluationsService: EvaluationsService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([EvaluationTag, Evaluation])
      ],
      providers: [DatabaseService, EvaluationTagsService, EvaluationsService]
    }).compile();

    evaluationTagsService = module.get<EvaluationTagsService>(
      EvaluationTagsService
    );
    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(() => {
    return databaseService.cleanAll();
  });

  describe('Test', () => {
    it('should', async () => {
      const evaluation = await evaluationsService.create(EVALUATION_1);
      expect(evaluation.id).toBeDefined();
    });
  });
  
});
