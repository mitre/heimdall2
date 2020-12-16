import {NotFoundException} from '@nestjs/common';
import {SequelizeModule} from '@nestjs/sequelize';
import {Test} from '@nestjs/testing';
import {
  CREATE_EVALUATION_DTO_WITHOUT_DATA,
  CREATE_EVALUATION_DTO_WITHOUT_FILENAME,
  CREATE_EVALUATION_DTO_WITHOUT_TAGS,
  EVALUATION_WITH_TAGS_1,
  UPDATE_EVALUATION,
  UPDATE_EVALUATION_DATA_ONLY,
  UPDATE_EVALUATION_FILENAME_ONLY
} from '../../test/constants/evaluations-test.constant';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTagsModule} from '../evaluation-tags/evaluation-tags.module';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {Evaluation} from './evaluation.model';
import {EvaluationsService} from './evaluations.service';

describe('EvaluationsService', () => {
  let evaluationsService: EvaluationsService;
  let evaluationTagsService: EvaluationTagsService;
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
    evaluationTagsService = module.get<EvaluationTagsService>(
      EvaluationTagsService
    );
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  beforeEach(() => {
    return databaseService.cleanAll();
  });

  describe('findAll', () => {
    it('should find all evaluations', async () => {
      let evaluationsDtoArray = await evaluationsService.findAll();
      expect(evaluationsDtoArray).toEqual([]);

      const evaluationOne = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1
      );
      const evaluationTwo = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1
      );
      evaluationsDtoArray = await evaluationsService.findAll();

      expect(evaluationsDtoArray[0].id).toEqual(evaluationOne.id);
      expect(evaluationsDtoArray[0].filename).toEqual(evaluationOne.filename);
      expect(evaluationsDtoArray[0].createdAt).toEqual(evaluationOne.createdAt);
      expect(evaluationsDtoArray[0].updatedAt).toEqual(evaluationOne.updatedAt);
      expect(evaluationsDtoArray[0].evaluationTags).toEqual(
        evaluationOne.evaluationTags
      );

      expect(evaluationsDtoArray[1].id).toEqual(evaluationTwo.id);
      expect(evaluationsDtoArray[1].filename).toEqual(evaluationTwo.filename);
      expect(evaluationsDtoArray[1].createdAt).toEqual(evaluationTwo.createdAt);
      expect(evaluationsDtoArray[1].updatedAt).toEqual(evaluationTwo.updatedAt);
      expect(evaluationsDtoArray[1].evaluationTags).toEqual(
        evaluationTwo.evaluationTags
      );
    });
  });

  describe('findById', () => {
    it('should find evaluations by id', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1
      );
      const foundEvaluation = await evaluationsService.findById(evaluation.id);
      expect(evaluation).toEqual(foundEvaluation);
    });

    it('should throw an error if an evaluation does not exist', async () => {
      expect.assertions(1);
      await expect(evaluationsService.findById(-1)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('create', () => {
    it('should create a new evaluation with evaluation tags', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1
      );
      expect(evaluation.id).toBeDefined();
      expect(evaluation.updatedAt).toBeDefined();
      expect(evaluation.createdAt).toBeDefined();
      expect(evaluation.data).toEqual(EVALUATION_WITH_TAGS_1.data);
      expect(evaluation.filename).toEqual(EVALUATION_WITH_TAGS_1.filename);
      expect(evaluation.evaluationTags?.[0].evaluationId).toBeDefined();
      expect(evaluation.evaluationTags?.[0].updatedAt).toBeDefined();
      expect(evaluation.evaluationTags?.[0].createdAt).toBeDefined();

      if (EVALUATION_WITH_TAGS_1.evaluationTags === undefined) {
        throw new TypeError(
          'Evaluation fixture does not have any assocaited tags.'
        );
      }

      expect(evaluation.evaluationTags?.[0].value).toEqual(
        EVALUATION_WITH_TAGS_1.evaluationTags[0].value
      );
    });

    it('should create a new evaluation without evaluation tags', async () => {
      const evaluation = await evaluationsService.create(
        CREATE_EVALUATION_DTO_WITHOUT_TAGS
      );
      expect(evaluation.id).toBeDefined();
      expect(evaluation.updatedAt).toBeDefined();
      expect(evaluation.createdAt).toBeDefined();
      expect(evaluation.data).toEqual(CREATE_EVALUATION_DTO_WITHOUT_TAGS.data);
      expect(evaluation.filename).toEqual(
        CREATE_EVALUATION_DTO_WITHOUT_TAGS.filename
      );
      expect(evaluation.evaluationTags).toBeNull();
      expect((await evaluationTagsService.findAll()).length).toBe(0);
    });

    it('should throw an error when missing the data field', async () => {
      expect.assertions(1);
      await expect(
        evaluationsService.create(CREATE_EVALUATION_DTO_WITHOUT_DATA)
      ).rejects.toThrow('notNull Violation: Evaluation.data cannot be null');
    });

    it('should throw an error when missing the filename field', async () => {
      expect.assertions(1);
      await expect(
        evaluationsService.create(CREATE_EVALUATION_DTO_WITHOUT_FILENAME)
      ).rejects.toThrow(
        'notNull Violation: Evaluation.filename cannot be null'
      );
    });
  });

  describe('update', () => {
    it('should throw an error if an evaluation does not exist', async () => {
      expect.assertions(1);
      await expect(
        evaluationsService.update(-1, UPDATE_EVALUATION)
      ).rejects.toThrow(NotFoundException);
    });

    it('should update all fields of an evaluation', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1
      );
      const updatedEvaluation = await evaluationsService.update(
        evaluation.id,
        UPDATE_EVALUATION
      );
      expect(updatedEvaluation.id).toEqual(evaluation.id);
      expect(updatedEvaluation.createdAt).toEqual(evaluation.createdAt);
      expect(updatedEvaluation.updatedAt).not.toEqual(evaluation.updatedAt);
      expect(updatedEvaluation.data).not.toEqual(evaluation.data);
      expect(updatedEvaluation.filename).not.toEqual(evaluation.filename);
    });

    it('should only update data if provided', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1
      );
      const updatedEvaluation = await evaluationsService.update(
        evaluation.id,
        UPDATE_EVALUATION_DATA_ONLY
      );
      expect(updatedEvaluation.id).toEqual(evaluation.id);
      expect(updatedEvaluation.createdAt).toEqual(evaluation.createdAt);
      expect(updatedEvaluation.updatedAt).not.toEqual(evaluation.updatedAt);
      expect(updatedEvaluation.evaluationTags).toEqual(
        evaluation.evaluationTags
      );
      expect(updatedEvaluation.data).not.toEqual(evaluation.data);
      expect(updatedEvaluation.filename).toEqual(evaluation.filename);
    });

    it('should only update filename if provided', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1
      );
      const updatedEvaluation = await evaluationsService.update(
        evaluation.id,
        UPDATE_EVALUATION_FILENAME_ONLY
      );
      expect(updatedEvaluation.id).toEqual(evaluation.id);
      expect(updatedEvaluation.createdAt).toEqual(evaluation.createdAt);
      expect(updatedEvaluation.updatedAt).not.toEqual(evaluation.updatedAt);
      expect(updatedEvaluation.evaluationTags).toEqual(
        evaluation.evaluationTags
      );
      expect(updatedEvaluation.data).toEqual(evaluation.data);
      expect(updatedEvaluation.filename).not.toEqual(evaluation.filename);
    });
  });

  describe('remove', () => {
    it('should remove an evaluation and its evaluation tags given an id', async () => {
      const evaluation = await evaluationsService.create(
        EVALUATION_WITH_TAGS_1
      );
      const removedEvaluation = await evaluationsService.remove(evaluation.id);
      const foundEvaluationTags = await evaluationTagsService.findAll();
      expect(foundEvaluationTags.length).toEqual(0);
      expect(removedEvaluation).toEqual(evaluation);

      await expect(
        evaluationsService.findById(removedEvaluation.id)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an error when the evaluation does not exist', async () => {
      expect.assertions(1);
      await expect(evaluationsService.findById(-1)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });
});
