import {CreateEvaluationDto} from '../../src/evaluations/dto/create-evaluation.dto';
import {EVALUATION_TAG_1} from './evaluation-tags-test.contant';

export const EVALUATION_1: CreateEvaluationDto = {
  data: {},
  version: '1.0',
  evaluationTags: [EVALUATION_TAG_1]
};
