import {EvaluationsService} from './evaluations.service';
import {DatabaseService} from '../database/database.service';
import {DatabaseModule} from '../database/database.module';
import {Evaluation} from './evaluation.model';
import {EvaluationTagsModule} from '../evaluation-tags/evaluation-tags.module';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
import {NotFoundException} from '@nestjs/common';
import {EVALUATION} from '../../test/constants/evaluations-test.constant';

describe('EvaluationsService', () => {
  let evaluationsService: EvaluationsService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        SequelizeModule.forFeature([Evaluation]),
        EvaluationTagsModule
      ],
      providers: [EvaluationsService, DatabaseService]
    }).compile();

    evaluationsService = module.get<EvaluationsService>(EvaluationsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  beforeEach(() => {
    return databaseService.cleanAll();
  });

  describe('exists', () => {
    it('throws an error when null', () => {
      expect(() => {
        evaluationsService.exists(null);
      }).toThrow(NotFoundException);
    });

    it('returns true when given an evaluation', () => {
      expect(() => {
        evaluationsService.exists(EVALUATION)
      }).toBeTruthy();
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
