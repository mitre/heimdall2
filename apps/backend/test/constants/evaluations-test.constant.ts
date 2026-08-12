import type { CreateEvaluationDto } from '../../src/evaluations/dto/create-evaluation.dto';
import type { EvaluationDto } from '../../src/evaluations/dto/evaluation.dto';
import type { UpdateEvaluationDto } from '../../src/evaluations/dto/update-evaluation.dto';
import type { Evaluation } from '../../src/evaluations/evaluation.model';
import { CREATE_EVALUATION_TAG_DTO } from './evaluation-tags-test.constant';
/* eslint-disable @typescript-eslint/ban-ts-comment */

const DEFAULT_FILE_NAME = 'example-result.json';

// @ts-ignore
export const EVALUATION_1: CreateEvaluationDto = {
  evaluationTags: [],
  filename: DEFAULT_FILE_NAME,
};

// @ts-ignore
export const EVALUATION_WITH_TAGS_1: CreateEvaluationDto = {
  evaluationTags: [CREATE_EVALUATION_TAG_DTO],
  filename: DEFAULT_FILE_NAME,
};

// @ts-ignore
export const CREATE_EVALUATION_DTO_WITHOUT_TAGS: CreateEvaluationDto = { filename: DEFAULT_FILE_NAME };

// @ts-ignore
export const CREATE_EVALUATION_DTO_WITHOUT_FILENAME: CreateEvaluationDto = { evaluationTags: [CREATE_EVALUATION_TAG_DTO] };

// @ts-ignore
export const CREATE_EVALUATION_DTO_WITHOUT_DATA: CreateEvaluationDto = {
  evaluationTags: [CREATE_EVALUATION_TAG_DTO],
  filename: DEFAULT_FILE_NAME,
};

// @ts-ignore
export const UPDATE_EVALUATION: UpdateEvaluationDto = {
  data: { filename: DEFAULT_FILE_NAME },
  filename: 'example-result-new.json',
};

// @ts-ignore
export const UPDATE_EVALUATION_FILENAME_ONLY: UpdateEvaluationDto = { filename: 'example-result-new.json' };

// @ts-ignore
export const UPDATE_EVALUATION_DATA_ONLY: UpdateEvaluationDto = { data: { filename: DEFAULT_FILE_NAME } };

// @ts-ignore
export const EVALUATION_DTO: EvaluationDto = {
  createdAt: new Date(),
  evaluationTags: [],
  filename: DEFAULT_FILE_NAME,
  id: '9999',
  updatedAt: new Date(),
};

// @ts-ignore
export const EVALUATION: Evaluation = {
  createdAt: new Date(),
  evaluationTags: [],
  filename: DEFAULT_FILE_NAME,
  id: '9999',
  updatedAt: new Date(),
};
/* eslint-enable @typescript-eslint/ban-ts-comment */
