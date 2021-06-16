import { Model } from 'sequelize-typescript';
import { Evaluation } from '../evaluations/evaluation.model';
export declare class EvaluationTag extends Model {
    id: string;
    value: string;
    createdAt: Date;
    updatedAt: Date;
    evaluationId: string;
    evaluation: Evaluation;
}
