import {CreateEvaluationDto} from '../../src/evaluations/dto/create-evaluation.dto';
import {UpdateEvaluationDto} from '../../src/evaluations/dto/update-evaluation.dto';
import {EvaluationDto} from '../../src/evaluations/dto/evaluation.dto';
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

// @ts-ignore
export const CREATE_EVALUATION_DTO_WITHOUT_TAGS: CreateEvaluationDto = {
  data: {},
  version: '1.0'
}

// @ts-ignore
export const CREATE_EVALUATION_DTO_WITHOUT_VERSION: CreateEvaluationDto = {
  data: {},
  evaluationTags: [CREATE_EVALUATION_TAG_DTO]
}

// @ts-ignore
export const CREATE_EVALUATION_DTO_WITHOUT_DATA: CreateEvaluationDto = {
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

export const EVALUATION_DTO: EvaluationDto = {
  id: 9999,
  data: {},
  version: '1.0',
  evaluationTags: [],
  createdAt: new Date(),
  updatedAt: new Date()
}
