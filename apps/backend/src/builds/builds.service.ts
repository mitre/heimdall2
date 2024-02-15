import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectModel} from '@nestjs/sequelize';
import {Op} from 'sequelize';
import {FindOptions} from 'sequelize/types';
import {DatabaseService} from '../database/database.service';
import {CreateBuildDto} from './dto/create-build.dto';
import {Build} from './build.model';
import {Group} from '../groups/group.model';
import {User} from '../users/user.model';
import {Evaluation} from '../evaluations/evaluation.model';

@Injectable()
export class BuildsService {
  constructor(
    @InjectModel(Build)
    private readonly buildModel: typeof Build,
  ) {}

  async findAll(): Promise<Build[]> {
    return this.buildModel.findAll<Build>({
      include: [User, {model: Group, include: [User]}]
    });
  }

  async count(): Promise<number> {
    return this.buildModel.count();
  }


  async findById(id: string): Promise<Build> {
    return this.findByPkBang(id);
  }

  async findByBuildId(buildId: string): Promise<Build> {
    return this.findOneBang({
      where: {
        buildId
      }
    });
  }

  async create(build : {
    buildId: string,
    buildType: number,
    branchName: string,
    userId?: string,
    groupId?: string,
  }): Promise<Build> {
    return Build.create<Build>(
      {
        ...build
      }
    );
  }

  async update(buildToUpdate: Build, groupDto: CreateBuildDto): Promise<Build> {
    buildToUpdate.update(groupDto);

    return buildToUpdate.save();
  }

  async remove(buildToDelete: Build): Promise<Build> {
    await buildToDelete.destroy();

    return buildToDelete;
  }

  async findByPkBang(id: string): Promise<Build> {
    // Users must be included for determining permissions on the group.
    // Other assocations should be called by their ID separately and not eagerly loaded.

    //TODO: potential optimization: we just need the evaluation id's and not the entire evalution object which contains the HDF content.
    const build = await this.buildModel.findByPk(id, {include: ['evaluations', User, {model: Group, include: [User]}]});
    if (build === null) {
      throw new NotFoundException('Build with given id not found');
    } else {
      return build;
    }
  }

  async findOneBang(options: FindOptions | undefined): Promise<Build> {
    const build = await this.buildModel.findOne<Build>(options);
    if (build === null) {
      throw new NotFoundException('Build with given id not found');
    } else {
      return build;
    }
  }

  async addEvaluationToBuild(build: Build, evaluation: Evaluation): Promise<void> {
    await build.$add('evaluation', evaluation, {
      through: {createdAt: new Date(), updatedAt: new Date()}
    });
  }

  async removeEvaluationFromBuild(build: Build, evaluation: Evaluation): Promise<Build> {
    return build.$remove('evaluation', evaluation);
  }
}
