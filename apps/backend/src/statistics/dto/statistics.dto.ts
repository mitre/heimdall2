import {IStatistics} from '@heimdall/interfaces';

export class StatisticsDTO implements IStatistics {
  readonly userCount: number;
  readonly evaluationCount: number;
  readonly evaluationTagCount: number;
  readonly userGroupCount: number;

  constructor(statistics: StatisticsDTO) {
    this.userCount = statistics.userCount;
    this.evaluationCount = statistics.evaluationCount;
    this.evaluationTagCount = statistics.evaluationTagCount;
    this.userGroupCount = statistics.userGroupCount;
  }
}
