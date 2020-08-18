import {CreateEvaluationDto} from '../../src/evaluations/dto/create-evaluation.dto';
import {UpdateEvaluationDto} from '../../src/evaluations/dto/update-evaluation.dto';
import {CREATE_EVALUATION_TAG_DTO} from './evaluation-tags-test.constant';
export const EVALUATION_1: CreateEvaluationDto = {
  data: {},
  version: '1.0',
  evaluationTags: []
};

export const EVALUATION_WITH_TAGS_1: CreateEvaluationDto = {
  data: {},
  version: '1.0',
  evaluationTags: [CREATE_EVALUATION_TAG_DTO]
}

export const UPDATE_EVALUATION: UpdateEvaluationDto = {
  data: {
    version: '1.0'
  },
  version: '1.1',
  evaluationTags: []
};
