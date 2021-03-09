import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {EvaluationTagsService} from '../evaluation-tags/evaluation-tags.service';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {GroupsService} from '../groups/groups.service';
import {UsersService} from '../users/users.service';
import {StatisticsDTO} from './dto/statistics.dto';
import {Statistics} from './statistics.model';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Statistics)
    private evaluationsService: EvaluationsService,
    private evaluationTagsService: EvaluationTagsService,
    private groupsService: GroupsService,
    private usersService: UsersService
  ) {}

  async getHeimdallStatistics(): Promise<StatisticsDTO> {
    const dbStatistics = await this.getStatistics();
    if (dbStatistics) return new StatisticsDTO(dbStatistics);
    else
      throw new NotFoundException(
        'Statistics not found in database (was the database seeded?)'
      );
  }

  async getStatistics(): Promise<Statistics | null> {
    return Statistics.findOne();
  }

  async getLoginCount(): Promise<number> {
    return Statistics.findOne().then((result) => {
      return result?.loginCount || 0;
    });
  }

  async incrementLoginCount(): Promise<number> {
    return Statistics.findOne().then((result) => {
      if (result) {
        result.increment(['loginCount']);
        return result.loginCount;
      } else {
        return 0;
      }
    });
  }

  async getProfileCount(): Promise<number> {
    return Statistics.findOne().then((result) => {
      return result?.profileCount || 0;
    });
  }

  async getUserCount(): Promise<number> {
    return Statistics.findOne().then((result) => {
      return result?.userCount || 0;
    });
  }

  async getUserGroupCount(): Promise<number> {
    return Statistics.findOne().then((result) => {
      return result?.userGroupCount || 0;
    });
  }
}
