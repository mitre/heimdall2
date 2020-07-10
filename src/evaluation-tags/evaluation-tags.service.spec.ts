import {Test} from '@nestjs/testing';
import {DatabaseModule} from '../database/database.module';
import {DatabaseService} from '../database/database.service';
import {EvaluationTagsService} from './evaluation-tags.service';
import {EvaluationTag} from './evaluation-tag.model';
import {SequelizeModule} from '@nestjs/sequelize';
import {NotFoundException} from '@nestjs/common';
import {Evaluation} from '../evaluations/evaluation.model';
import {
  EVALUATION_TAG_1,
  CREATE_EVALUATION_TAG_DTO,
  CREATE_EVALUATION_TAG_DTO_MISSING_KEY,
  CREATE_EVALUATION_TAG_DTO_MISSING_VALUE,
  UPDATE_EVALUATION_TAG_DTO,
  UPDATE_EVALUATION_TAG_DTO_MISSING_VALUE,
  UPDATE_EVALUATION_TAG_DTO_MISSING_KEY
} from '../../test/constants/evaluation-tags-test.contant';

describe('EvaluationTagsService', () => {
  let evaluationTagsService: EvaluationTagsService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [DatabaseModule, SequelizeModule.forFeature([EvaluationTag, Evaluation])],
      providers: [DatabaseService, EvaluationTagsService]
    }).compile();

    evaluationTagsService = module.get<EvaluationTagsService>(EvaluationTagsService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  })

  afterAll(async () => {
    await databaseService.cleanAll();
    await databaseService.closeConnection();
  });

  beforeEach(() => {
    return databaseService.cleanAll();
  });

  describe('exists', () => {
    it('throws an error when null', () => {
      expect(() => {
        evaluationTagsService.exists(null);
      }).toThrow(NotFoundException);
    });

    it('returns true when given an EvaluationTag', () => {
      expect(() => {
        evaluationTagsService.exists(EVALUATION_TAG_1);
      }).toBeTruthy();
    });
  });

  describe('Create', () => {
    it('should create a valid EvaluationTag', async () => {
      const evaluationTag = await evaluationTagsService.create(CREATE_EVALUATION_TAG_DTO);
      expect(evaluationTag.id).toBeDefined();
      expect(evaluationTag.createdAt).toBeDefined();
      expect(evaluationTag.updatedAt).toBeDefined();
      expect(evaluationTag.key).toEqual(CREATE_EVALUATION_TAG_DTO.key);
      expect(evaluationTag.value).toEqual(CREATE_EVALUATION_TAG_DTO.value);
    });

    describe('With missing fields', () => {
      it('should throw an error with key', async () => {
        expect.assertions(1);
        await expect(
          evaluationTagsService.create(CREATE_EVALUATION_TAG_DTO_MISSING_KEY)
        ).rejects.toThrow('notNull Violation: EvaluationTag.key cannot be null');
      });

      it('should throw an error with value', async () => {
        expect.assertions(1);
        await expect(
          evaluationTagsService.create(CREATE_EVALUATION_TAG_DTO_MISSING_VALUE)
        ).rejects.toThrow('notNull Violation: EvaluationTag.value cannot be null');
      })
    });
  });

  describe('FindAll', () => {
    it('should find all existing EvaluationTags', async () => {
      // No existing tags
      let foundEvaluationTags = await evaluationTagsService.findAll();
      expect(foundEvaluationTags).toBeDefined();
      expect(foundEvaluationTags.length).toEqual(0);
      // One existing tag
      await evaluationTagsService.create(CREATE_EVALUATION_TAG_DTO);
      foundEvaluationTags = await evaluationTagsService.findAll();
      expect(foundEvaluationTags.length).toEqual(1);
      // Multiple existing tags
      await evaluationTagsService.create(CREATE_EVALUATION_TAG_DTO);
      foundEvaluationTags = await evaluationTagsService.findAll();
      expect(foundEvaluationTags.length).toBeGreaterThan(1);
    });
  });

  describe('Update', () => {
    it('should update given a valid dto', async () => {
      const evaluationTag = await evaluationTagsService.create(CREATE_EVALUATION_TAG_DTO)
      const updatedEvaluationTag = await evaluationTagsService.update(evaluationTag.id, UPDATE_EVALUATION_TAG_DTO);
      expect(updatedEvaluationTag.key).toEqual(UPDATE_EVALUATION_TAG_DTO.key);
      expect(updatedEvaluationTag.value).toEqual(UPDATE_EVALUATION_TAG_DTO.value);
      expect(updatedEvaluationTag.updatedAt.valueOf()).not.toEqual(evaluationTag.updatedAt.valueOf());
    });

    it('should update only key', async () => {
      const evaluationTag = await evaluationTagsService.create(CREATE_EVALUATION_TAG_DTO)
      const updatedEvaluationTag = await evaluationTagsService.update(evaluationTag.id, UPDATE_EVALUATION_TAG_DTO_MISSING_VALUE);
      expect(updatedEvaluationTag.key).toEqual(UPDATE_EVALUATION_TAG_DTO.key);
      expect(updatedEvaluationTag.value).toEqual(evaluationTag.value);
      expect(updatedEvaluationTag.updatedAt.valueOf()).not.toEqual(evaluationTag.updatedAt.valueOf());
    });

    it('should update only value', async () => {
      const evaluationTag = await evaluationTagsService.create(CREATE_EVALUATION_TAG_DTO)
      const updatedEvaluationTag = await evaluationTagsService.update(evaluationTag.id, UPDATE_EVALUATION_TAG_DTO_MISSING_KEY);
      expect(updatedEvaluationTag.value).toEqual(UPDATE_EVALUATION_TAG_DTO.value);
      expect(updatedEvaluationTag.key).toEqual(evaluationTag.key);
      expect(updatedEvaluationTag.updatedAt.valueOf()).not.toEqual(evaluationTag.updatedAt.valueOf());
    });
  });

  describe('Remove', () => {
    it('should remove an existing tag', async () => {
      const evaluationTag = await evaluationTagsService.create(CREATE_EVALUATION_TAG_DTO);
      expect(evaluationTag).toBeDefined();
      const removedEvaluationTag = await evaluationTagsService.remove(evaluationTag.id);
      expect(removedEvaluationTag.key).toEqual(evaluationTag.key);
      expect(removedEvaluationTag.value).toEqual(evaluationTag.value);
      const foundEvaluationTag = await EvaluationTag.findByPk<EvaluationTag>(evaluationTag.id)
      expect(foundEvaluationTag).toEqual(null);
    });
  });
});


