// import {NotFoundException} from '@nestjs/common';
// import {SequelizeModule} from '@nestjs/sequelize';
// import {Test} from '@nestjs/testing';
// import {
//   CREATE_EVALUATION_DTO_WITHOUT_FILENAME,
//   CREATE_EVALUATION_DTO_WITHOUT_TAGS,
//   EVALUATION_WITH_TAGS_1,
//   UPDATE_EVALUATION,
//   UPDATE_EVALUATION_DATA_ONLY,
//   UPDATE_EVALUATION_FILENAME_ONLY
// } from '../../test/constants/pipelines-test.constant';
// import {GROUP_1} from '../../test/constants/groups-test.constant';
// import {CREATE_USER_DTO_TEST_OBJ} from '../../test/constants/users-test.constant';
// import {DatabaseModule} from '../database/database.module';
// import {DatabaseService} from '../database/database.service';
// // import {PipelineTagsModule} from '../pipeline-tags/pipeline-tags.module';
// // import {PipelineTagsService} from '../pipeline-tags/pipeline-tags.service';
// // import {GroupPipeline} from '../group-pipelines/group-pipeline.model';
// // import {GroupUser} from '../group-users/group-user.model';
// // import {Group} from '../groups/group.model';
// // import {GroupsService} from '../groups/groups.service';
// import {UserDto} from '../users/dto/user.dto';
// import {UsersModule} from '../users/users.module';
// import {UsersService} from '../users/users.service';
// import {PipelineDto} from './dto/pipeline.dto';
// import {Pipeline} from './pipeline.model';
// import {PipelinesService} from './pipelines.service';

// describe('PipelinesService', () => {
//   let pipelinesService: PipelinesService;
//   //let pipelineTagsService: PipelineTagsService;
//   let databaseService: DatabaseService;
//   let usersService: UsersService;
//   let user: UserDto;
//   //let groupsService: GroupsService;

//   beforeAll(async () => {
//     const module = await Test.createTestingModule({
//       imports: [
//         DatabaseModule,
//         SequelizeModule.forFeature([
//           Pipeline,
//           // GroupUser,
//           // Group,
//           // GroupPipeline
//         ]),
// //        PipelineTagsModule,
//         UsersModule
//       ],
//       providers: [
//         PipelinesService,
//         DatabaseService,
//         UsersService,
//   //      GroupsService
//       ]
//     }).compile();

//     pipelinesService = module.get<PipelinesService>(PipelinesService);
//     // pipelineTagsService = module.get<PipelineTagsService>(
//     //   PipelineTagsService
//     // );
//     databaseService = module.get<DatabaseService>(DatabaseService);
//     usersService = module.get<UsersService>(UsersService);
//     //groupsService = module.get<GroupsService>(GroupsService);
//   });

//   beforeEach(async () => {
//     await databaseService.cleanAll();
//     user = new UserDto(await usersService.create(CREATE_USER_DTO_TEST_OBJ));
//   });

//   describe('findAll', () => {
//     it('should find all pipelines', async () => {
//       let pipelinesDtoArray = await pipelinesService.findAll();
//       expect(pipelinesDtoArray).toEqual([]);

//       await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });
//       await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });
//       pipelinesDtoArray = await pipelinesService.findAll();
//       expect(pipelinesDtoArray.length).toEqual(2);
//     });

//     it('should include the pipeline user', async () => {
//       await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });

//       const pipelines = await pipelinesService.findAll();
//       expect(new UserDto(pipelines[0].user)).toEqual(user);
//     });

//     it('should include the pipeline group and group users', async () => {
//       //const group = await groupsService.create(GROUP_1);
//       const owner = await usersService.findById(user.id);
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });

//       let pipelines = await pipelinesService.findAll();
//       expect(pipelines[0].groups[0]).not.toBeDefined();

//       // await groupsService.addPipelineToGroup(group, pipeline);
//       // await groupsService.addUserToGroup(group, owner, 'owner');

//       pipelines = await pipelinesService.findAll();
//       const foundGroup = pipelines[0].groups[0];
//       expect(foundGroup).toBeDefined();
//       //expect(foundGroup.id).toEqual(group.id);
//       expect(foundGroup.users.length).toEqual(1);
//       expect(foundGroup.users[0].id).toEqual(owner.id);
//       expect(foundGroup.users[0].GroupUser.role).toEqual('owner');
//     });
//   });

//   describe('findById', () => {
//     it('should find pipelines by id', async () => {
//       expect.assertions(1);
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });
//       const foundPipeline = await pipelinesService.findById(pipeline.id);
//       expect(new PipelineDto(pipeline)).toEqual(
//         new PipelineDto(foundPipeline)
//       );
//     });

//     it('should throw an error if an pipeline does not exist', async () => {
//       expect.assertions(1);
//       await expect(pipelinesService.findById('-1')).rejects.toThrow(
//         NotFoundException
//       );
//     });
//   });

//   describe('create', () => {
//     it('should create a new pipeline with pipeline tags', async () => {
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });
//       expect(pipeline.id).toBeDefined();
//       expect(pipeline.updatedAt).toBeDefined();
//       expect(pipeline.createdAt).toBeDefined();
//       expect(pipeline.data).toEqual({});
//       expect(pipeline.filename).toEqual(EVALUATION_WITH_TAGS_1.filename);
//       expect(pipeline.pipelineTags[0].pipelineId).toBeDefined();
//       expect(pipeline.pipelineTags[0].updatedAt).toBeDefined();
//       expect(pipeline.pipelineTags[0].createdAt).toBeDefined();

//       if (EVALUATION_WITH_TAGS_1.pipelineTags === undefined) {
//         throw new TypeError(
//           'Pipeline fixture does not have any associated tags.'
//         );
//       }

//       expect(pipeline.pipelineTags?.[0].value).toEqual(
//         EVALUATION_WITH_TAGS_1.pipelineTags[0].value
//       );
//     });

//     it('should create a new pipeline without pipeline tags', async () => {
//       const pipeline = await pipelinesService.create({
//         ...CREATE_EVALUATION_DTO_WITHOUT_TAGS,
//         data: {},
//         userId: user.id
//       });
//       expect(pipeline.id).toBeDefined();
//       expect(pipeline.updatedAt).toBeDefined();
//       expect(pipeline.createdAt).toBeDefined();
//       expect(pipeline.data).toEqual({});
//       expect(pipeline.filename).toEqual(
//         CREATE_EVALUATION_DTO_WITHOUT_TAGS.filename
//       );
//       expect(pipeline.pipelineTags).not.toBeDefined();
//       //expect((await pipelineTagsService.findAll()).length).toBe(0);
//     });

//     it('should throw an error when missing the filename field', async () => {
//       expect.assertions(1);
//       await expect(
//         pipelinesService.create({
//           ...CREATE_EVALUATION_DTO_WITHOUT_FILENAME,
//           data: {},
//           userId: user.id
//         })
//       ).rejects.toThrow(
//         'notNull Violation: Pipeline.filename cannot be null'
//       );
//     });
//   });

//   describe('update', () => {
//     it('should throw an error if an pipeline does not exist', async () => {
//       expect.assertions(1);
//       await expect(
//         pipelinesService.update('-1', UPDATE_EVALUATION)
//       ).rejects.toThrow(NotFoundException);
//     });

//     it('should update all fields of an pipeline', async () => {
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });
//       const updatedPipeline = await pipelinesService.update(
//         pipeline.id,
//         UPDATE_EVALUATION
//       );
//       expect(updatedPipeline.id).toEqual(pipeline.id);
//       expect(updatedPipeline.createdAt).toEqual(pipeline.createdAt);
//       expect(updatedPipeline.updatedAt).not.toEqual(pipeline.updatedAt);
//       expect(updatedPipeline.data).not.toEqual(pipeline.data);
//       expect(updatedPipeline.filename).not.toEqual(pipeline.filename);
//     });

//     it('should only update data if provided', async () => {
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });
//       const updatedPipeline = await pipelinesService.update(
//         pipeline.id,
//         UPDATE_EVALUATION_DATA_ONLY
//       );
//       expect(updatedPipeline.id).toEqual(pipeline.id);
//       expect(updatedPipeline.createdAt).toEqual(pipeline.createdAt);
//       expect(updatedPipeline.updatedAt).not.toEqual(pipeline.updatedAt);
//       expect(updatedPipeline.pipelineTags.length).toEqual(
//         pipeline.pipelineTags.length
//       );
//       expect(updatedPipeline.data).not.toEqual(pipeline.data);
//       expect(updatedPipeline.filename).toEqual(pipeline.filename);
//     });

//     it('should only update filename if provided', async () => {
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });

//       const updatedPipeline = await pipelinesService.update(
//         pipeline.id,
//         UPDATE_EVALUATION_FILENAME_ONLY
//       );
//       expect(updatedPipeline.id).toEqual(pipeline.id);
//       expect(updatedPipeline.createdAt).toEqual(pipeline.createdAt);
//       expect(updatedPipeline.updatedAt).not.toEqual(pipeline.updatedAt);
//       expect(updatedPipeline.pipelineTags.length).toEqual(
//         pipeline.pipelineTags.length
//       );
//       expect(updatedPipeline.data).toEqual(pipeline.data);
//       expect(updatedPipeline.filename).not.toEqual(pipeline.filename);
//     });
//   });

//   describe('remove', () => {
//     it('should remove an pipeline and its pipeline tags given an id', async () => {
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: {},
//         userId: user.id
//       });
//       const removedPipeline = await pipelinesService.remove(pipeline.id);
//       const foundPipelineTags = await pipelineTagsService.findAll();
//       expect(foundPipelineTags.length).toEqual(0);
//       expect(new PipelineDto(removedPipeline)).toEqual(
//         new PipelineDto(pipeline)
//       );

//       await expect(
//         pipelinesService.findById(removedPipeline.id)
//       ).rejects.toThrow(NotFoundException);
//     });

//     it('should throw an error when the pipeline does not exist', async () => {
//       expect.assertions(1);
//       await expect(pipelinesService.findById('-1')).rejects.toThrow(
//         NotFoundException
//       );
//     });
//   });

//   afterAll(async () => {
//     await databaseService.cleanAll();
//     await databaseService.closeConnection();
//   });
// });
