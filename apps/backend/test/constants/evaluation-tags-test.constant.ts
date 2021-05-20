import {CreateEvaluationTagDto} from '../../src/evaluation-tags/dto/create-evaluation-tag.dto';
import {EvaluationTagDto} from '../../src/evaluation-tags/dto/evaluation-tag.dto';
import {EvaluationTag} from '../../src/evaluation-tags/evaluation-tag.model';

/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore
export const EVALUATION_TAG_1: EvaluationTag = {
  value: 'value string',
  evaluationId: '1'
};

export const EVALUATION_TAG_DTO: EvaluationTagDto = {
  id: '10001',
  value: 'value string',
  evaluationId: '1',
  createdAt: new Date(),
  updatedAt: new Date()
};

export const CREATE_EVALUATION_TAG_DTO: CreateEvaluationTagDto = {
  value: 'value string'
};

// @ts-ignore
export const CREATE_EVALUATION_TAG_DTO_MISSING_KEY: CreateEvaluationTagDto = {
  value: 'value string'
};

// @ts-ignore
export const CREATE_EVALUATION_TAG_DTO_MISSING_VALUE: CreateEvaluationTagDto = {};

/* eslint-enable @typescript-eslint/ban-ts-comment */
