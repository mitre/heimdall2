export class EvaluationTagDto {
  readonly id: string;
  readonly value: string;
  readonly evaluationId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(evaluationTag: {id: number; value: string | null; evaluationId?: number | null; createdAt: string; updatedAt: string}) {
    this.id = String(evaluationTag.id);
    this.value = evaluationTag.value ?? '';
    this.evaluationId = String(evaluationTag.evaluationId);
    this.createdAt = new Date(evaluationTag.createdAt);
    this.updatedAt = new Date(evaluationTag.updatedAt);
  }
}
