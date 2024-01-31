import {IStatistics} from '@heimdall/interfaces';

export class StatisticsDTO implements IStatistics {
  readonly apiKeyCount: number;
  readonly userCount: number;
  readonly evaluationCount: number;
  readonly evaluationTagCount: number;
  readonly groupCount: number;
  readonly buildCount: number;
  readonly productCount: number;

  constructor(statistics: StatisticsDTO) {
    this.apiKeyCount = statistics.apiKeyCount;
    this.userCount = statistics.userCount;
    this.evaluationCount = statistics.evaluationCount;
    this.evaluationTagCount = statistics.evaluationTagCount;
    this.buildCount = statistics.buildCount;
    this.productCount = statistics.productCount;
    this.groupCount = statistics.groupCount;
  }
}
