import {ForbiddenError} from '@casl/ability';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Delete,
  Param,
  Post,
  Request,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import _ from 'lodash';
import {AuthzService} from '../authz/authz.service';
import {Action} from '../casl/casl-ability.factory';
import {EvaluationsService} from '../evaluations/evaluations.service';
import {Group} from '../groups/group.model';
import {GroupsService} from '../groups/groups.service';
import {APIKeyOrJwtAuthGuard} from '../guards/api-key-or-jwt-auth.guard';
import {JwtAuthGuard} from '../guards/jwt-auth.guard';
import {LoggingInterceptor} from '../interceptors/logging.interceptor';
import {User} from '../users/user.model';
import {CreateBuildDto} from './dto/create-build.dto';
import {BuildDto} from './dto/build.dto';
import {BuildsService} from './builds.service';
import {Evaluation} from '../evaluations/evaluation.model';
import {AddEvaluationToBuildDto} from './dto/add-evaluation-to-build-dto';
import {RemoveEvaluationFromBuildDto} from './dto/remove-evaluation-from-build-dto';


@Controller('builds')
@UseInterceptors(LoggingInterceptor)
export class BuildsController {
  constructor(
    private readonly buildService: BuildsService,
    private readonly evaluationsService: EvaluationsService,
    private readonly groupsService: GroupsService,
    private readonly authz: AuthzService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() request: {user: User}): Promise<BuildDto[]> {
    const abac = this.authz.abac.createForUser(request.user);
    let builds = await this.buildService.findAll();
    builds = builds.filter((build) =>
      abac.can(Action.Read, build)
    );
    return builds.map((build) => new BuildDto(build));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(
    @Request() request: {user: User},
    @Param('id') id: string
  ): Promise<BuildDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const build = await this.buildService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Read, build);
    return new BuildDto(build, false);
  }

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Get('id/:id')
  async findByBuildId(
    @Request() request: {user: User},
    @Param('id') id: string
  ): Promise<BuildDto> {
        const build = await this.buildService.findByBuildId(id);
    return new BuildDto(build, false);
  }

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Post()
  async create(
    @Request() request: {user: User | Group},
    @Body() createBuildDto: CreateBuildDto
  ): Promise<BuildDto> {
    if (request.user instanceof Group) {
      // Build created by Group API Key
      const build = await this.buildService
      .create({
        buildId: createBuildDto.buildId,
        buildType: createBuildDto.buildType,
        branchName: createBuildDto.branchName,
        groupId: request.user.id
      })
      .then(async (createdBuild) => {
        const group = await this.groupsService.findByPkBang(
          request.user.id
        );
        this.groupsService.addBuildToGroup(group, createdBuild)
        return createdBuild;
      })
      .catch((err) => {
        throw new BadRequestException(err.message);
      });

      return new BuildDto(build);
    }

    // Build created by User's JWT
    let groups: Group[] = createBuildDto.groups
      ? await this.groupsService.findByIds(createBuildDto.groups)
      : [];

    // Make sure the user can add evaluations to each group
    const abac = this.authz.abac.createForUser(request.user);
    groups = groups.filter((group) => {
      return abac.can(Action.AddEvaluation, group);
    });

    const build = await this.buildService
    .create({
      buildId: createBuildDto.buildId,
      buildType: createBuildDto.buildType,
      branchName: createBuildDto.branchName,
      groupId: request.user.id
    })
    .then((createdBuild) => {
      groups.forEach((group) =>
        this.groupsService.addBuildToGroup(group, createdBuild)
      );
      return createdBuild;
    });

    return new BuildDto(build);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() request: {user: User}
  ): Promise<BuildDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const build = await this.buildService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Manage, build);
    return new BuildDto(await this.buildService.remove(build));
  }

  @UseGuards(APIKeyOrJwtAuthGuard)
  @Post('/:id/evaluation')
  async addEvaluationToBuild(
    @Param('id') id: string,
    @Request() request: {evaluation: Evaluation},
    @Body() addEvaluationToBuildDto: AddEvaluationToBuildDto
  ): Promise<BuildDto> {
    const build = await this.buildService.findByPkBang(id);
    const evaluationToAdd = await this.evaluationsService.findById(
      addEvaluationToBuildDto.evaluationId
    );
    await this.buildService.addEvaluationToBuild(
      build,
      evaluationToAdd
    );
    return new BuildDto(build);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/:id/evaluation')
  async removeEvaluationFromBuild(
    @Param('id') id: string,
    @Request() request: {user: User},
    @Body() removeEvaluationFromBuildDto: RemoveEvaluationFromBuildDto
  ): Promise<BuildDto> {
    const abac = this.authz.abac.createForUser(request.user);
    const build = await this.buildService.findByPkBang(id);
    ForbiddenError.from(abac).throwUnlessCan(Action.Manage, build);
    const evaluationToRemove = await this.evaluationsService.findById(
      removeEvaluationFromBuildDto.evaluationId
    );
    return new BuildDto(
      await this.buildService.removeEvaluationFromBuild(build, evaluationToRemove)
    );
  }
}
