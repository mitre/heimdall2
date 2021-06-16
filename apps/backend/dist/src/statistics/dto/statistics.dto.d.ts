import { IStatistics } from '@heimdall/interfaces';
export declare class StatisticsDTO implements IStatistics {
    readonly userCount: number;
    readonly evaluationCount: number;
    readonly evaluationTagCount: number;
    readonly groupCount: number;
    constructor(statistics: StatisticsDTO);
}
