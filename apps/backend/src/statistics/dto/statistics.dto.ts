import {IStatistics} from '@heimdall/interfaces';

export class StatisticsDTO implements IStatistics {
  readonly userCount: number;
  readonly evaluationCount: number;
  readonly evaluationTagCount: number;
  readonly groupCount: number;

  constructor(statistics: StatisticsDTO) {
    this.userCount = statistics.userCount;
    this.evaluationCount = statistics.evaluationCount;
    this.evaluationTagCount = statistics.evaluationTagCount;
    this.groupCount = statistics.groupCount;
  }
}
