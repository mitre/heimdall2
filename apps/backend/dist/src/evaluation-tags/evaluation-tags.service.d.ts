/// <reference types="node" />
import { FindOptions } from 'sequelize/types';
import { CreateEvaluationTagDto } from './dto/create-evaluation-tag.dto';
import { EvaluationTag } from './evaluation-tag.model';
export declare class EvaluationTagsService {
    private evaluationTagModel;
    constructor(evaluationTagModel: typeof EvaluationTag);
    findAll(): Promise<EvaluationTag[]>;
    count(): Promise<number>;
    findById(id: string): Promise<EvaluationTag>;
    create(evaluationId: string, createEvaluationTagDto: CreateEvaluationTagDto): Promise<EvaluationTag>;
    remove(id: string): Promise<EvaluationTag>;
    findByPkBang(identifier: string | number | Buffer | undefined, options: Pick<FindOptions, 'include'>): Promise<EvaluationTag>;
}
