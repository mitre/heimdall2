/// <reference types="node" />
import { FindOptions } from 'sequelize/types';
import { DatabaseService } from '../database/database.service';
import { CreateEvaluationTagDto } from '../evaluation-tags/dto/create-evaluation-tag.dto';
import { Group } from '../groups/group.model';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { Evaluation } from './evaluation.model';
export declare class EvaluationsService {
    private evaluationModel;
    private databaseService;
    constructor(evaluationModel: typeof Evaluation, databaseService: DatabaseService);
    findAll(): Promise<Evaluation[]>;
    count(): Promise<number>;
    create(evaluation: {
        filename: string;
        evaluationTags: CreateEvaluationTagDto[] | undefined;
        public: boolean;
        data: unknown;
        userId: string;
    }): Promise<Evaluation>;
    update(id: string, updateEvaluationDto: UpdateEvaluationDto): Promise<Evaluation>;
    remove(id: string): Promise<Evaluation>;
    findById(id: string): Promise<Evaluation>;
    groups(id: string): Promise<Group[]>;
    findByPkBang(identifier: string | number | Buffer | undefined, options: Pick<FindOptions, 'include'>): Promise<Evaluation>;
}
