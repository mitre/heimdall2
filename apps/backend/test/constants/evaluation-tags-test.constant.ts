import type { CreateEvaluationTagDto } from '../../src/evaluation-tags/dto/create-evaluation-tag.dto';
import type { EvaluationTagDto } from '../../src/evaluation-tags/dto/evaluation-tag.dto';
import type { EvaluationTag } from '../../src/evaluation-tags/evaluation-tag.model';

/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore
export const EVALUATION_TAG_1: EvaluationTag = {
  evaluationId: '1',
  value: 'value string',
};

export const EVALUATION_TAG_DTO: EvaluationTagDto = {
  createdAt: new Date(),
  evaluationId: '1',
  id: '10001',
  updatedAt: new Date(),
  value: 'value string',
};

export const CREATE_EVALUATION_TAG_DTO: CreateEvaluationTagDto = { value: 'value string' };

// @ts-ignore
export const CREATE_EVALUATION_TAG_DTO_MISSING_KEY: CreateEvaluationTagDto = { value: 'value string' };

// @ts-ignore
export const CREATE_EVALUATION_TAG_DTO_MISSING_VALUE: CreateEvaluationTagDto
  = {};

/* eslint-enable @typescript-eslint/ban-ts-comment */
