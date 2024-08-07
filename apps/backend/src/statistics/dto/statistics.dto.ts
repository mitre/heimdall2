import {IStatistics} from '@heimdall/common/interfaces';

export class StatisticsDTO implements IStatistics {
  readonly apiKeyCount: number;
  readonly userCount: number;
  readonly evaluationCount: number;
  readonly evaluationTagCount: number;
  readonly groupCount: number;

  constructor(statistics: StatisticsDTO) {
    this.apiKeyCount = statistics.apiKeyCount;
    this.userCount = statistics.userCount;
    this.evaluationCount = statistics.evaluationCount;
    this.evaluationTagCount = statistics.evaluationTagCount;
    this.groupCount = statistics.groupCount;
  }
}
