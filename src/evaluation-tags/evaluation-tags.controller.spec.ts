import {Test, TestingModule} from '@nestjs/testing';
import {EvaluationTagsController} from './evaluation-tags.controller';
import {EvaluationTagsService} from './evaluation-tags.service';
import {EVALUATION_TAG_DTO} from '../../test/constants/evaluation-tags-test.contant';

describe('EvaluationTagsController', () => {
  let evaluationTagsController: EvaluationTagsController;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [EvaluationTagsController],
      providers: [
        {
          provide: EvaluationTagsService,
          useFactory: () => ({
            findAll: jest.fn(() => [EVALUATION_TAG_DTO])
          })
        }
      ]
    }).compile();
    evaluationTagsController = module.get<EvaluationTagsController>(
      EvaluationTagsController
    );
  });

  describe('index', () => {
    it('should return EvaluationTags', async () => {
      const evaluationTags = await evaluationTagsController.index();
      expect(evaluationTags).toContain(EVALUATION_TAG_DTO);
    });
  });
});
