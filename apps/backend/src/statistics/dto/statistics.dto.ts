import {IStatistics} from '@heimdall/interfaces';
import {Statistics} from '../statistics.model';

export class StatisticsDTO implements IStatistics {
  readonly userCount: number;
  readonly evaluationCount: number;
  readonly evaluationTagCount: number;
  readonly userGroupCount: number;
  readonly loginCount: number;

  constructor(statistics: Statistics) {
    this.userCount = statistics.userCount;
    this.evaluationCount = statistics.evaluationCount;
    this.evaluationTagCount = statistics.evaluationTagCount;
    this.userGroupCount = statistics.userGroupCount;
    this.loginCount = statistics.loginCount;
  }
}
