import {SequelizeModule} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
import {
  CREATE_EVALUATION_TAG_DTO,
  CREATE_EVALUATION_TAG_DTO_MISSING_VALUE,
  UPDATE_EVALUATION_TAG_DTO
} from '../../test/constants/evaluation-tags-test.constant';
import {EVALUATION_1} from '../../test/constants/evaluations-test.constant';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {Evaluation} from '../evaluations/evaluation.model';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {EvaluationTag} from './evaluation-tag.model';
import {EvaluationTagsService} from './evaluation-tags.service';

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

  describe('Create', () => {
    it('should create a valid EvaluationTag', async () => {
      const evaluation = await evaluationsService.create(EVALUATION_1);
      const evaluationTag = await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      expect(evaluationTag.id).toBeDefined();
      expect(evaluationTag.evaluationId).toEqual(evaluation.id);
      expect(evaluationTag.createdAt).toBeDefined();
      expect(evaluationTag.updatedAt).toBeDefined();
      expect(evaluationTag.value).toEqual(CREATE_EVALUATION_TAG_DTO.value);
    });

    describe('With missing fields', () => {
      it('should throw an error with value', async () => {
        expect.assertions(1);
        const evaluation = await evaluationsService.create(EVALUATION_1);
        await expect(
          evaluationTagsService.create(
            evaluation.id,
            CREATE_EVALUATION_TAG_DTO_MISSING_VALUE
          )
        ).rejects.toThrow(
          'notNull Violation: EvaluationTag.value cannot be null'
        );
      });
    });
  });

  describe('FindAll', () => {
    it('should find all existing EvaluationTags', async () => {
      const evaluation = await evaluationsService.create(EVALUATION_1);
      // No existing tags
      let foundEvaluationTags = await evaluationTagsService.findAll();
      expect(foundEvaluationTags).toBeDefined();
      expect(foundEvaluationTags.length).toEqual(0);
      // One existing tag
      await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      foundEvaluationTags = await evaluationTagsService.findAll();
      expect(foundEvaluationTags.length).toEqual(1);
      // Multiple existing tags
      await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      foundEvaluationTags = await evaluationTagsService.findAll();
      expect(foundEvaluationTags.length).toBeGreaterThan(1);
    });
  });

  describe('Update', () => {
    it('should update given a valid dto', async () => {
      const evaluation = await evaluationsService.create(EVALUATION_1);
      const evaluationTag = await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      const updatedEvaluationTag = await evaluationTagsService.update(
        evaluationTag.id,
        UPDATE_EVALUATION_TAG_DTO
      );
      expect(updatedEvaluationTag.value).toEqual(
        UPDATE_EVALUATION_TAG_DTO.value
      );
      expect(updatedEvaluationTag.updatedAt.valueOf()).not.toEqual(
        evaluationTag.updatedAt.valueOf()
      );
    });
  });

  describe('Remove', () => {
    it('should remove an existing tag', async () => {
      const evaluation = await evaluationsService.create(EVALUATION_1);
      const evaluationTag = await evaluationTagsService.create(
        evaluation.id,
        CREATE_EVALUATION_TAG_DTO
      );
      expect(evaluationTag).toBeDefined();
      const removedEvaluationTag = await evaluationTagsService.remove(
        evaluationTag.id
      );
      expect(removedEvaluationTag.value).toEqual(evaluationTag.value);
      const foundEvaluationTag = await EvaluationTag.findByPk<EvaluationTag>(
        evaluationTag.id
      );
      expect(foundEvaluationTag).toEqual(null);
    });
  });
});
