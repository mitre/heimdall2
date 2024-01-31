// import {ForbiddenError} from '@casl/ability';
// import {NotFoundException} from '@nestjs/common';
// import {SequelizeModule} from '@nestjs/sequelize';
// import {Test, TestingModule} from '@nestjs/testing';
// import {
//   CREATE_EVALUATION_DTO_WITHOUT_TAGS,
//   EVALUATION_1,
//   EVALUATION_WITH_TAGS_1,
//   UPDATE_EVALUATION
// } from '../../test/constants/pipelines-test.constant';
// import {
//   GROUP_1,
//   PRIVATE_GROUP
// } from '../../test/constants/groups-test.constant';
// import {
//   CREATE_ADMIN_DTO,
//   CREATE_USER_DTO_TEST_OBJ,
//   CREATE_USER_DTO_TEST_OBJ_2
// } from '../../test/constants/users-test.constant';
// import {AuthzService} from '../authz/authz.service';
// import {ConfigService} from '../config/config.service';
// import {DatabaseModule} from '../database/database.module';
// import {DatabaseService} from '../database/database.service';
// //import {PipelineTag} from '../pipeline-tags/pipeline-tag.model';
// // import {GroupPipeline} from '../group-pipelines/group-pipeline.model';
// // import {GroupUser} from '../group-users/group-user.model';
// // import {Group} from '../groups/group.model';
// // import {GroupsService} from '../groups/groups.service';
// import {User} from '../users/user.model';
// import {UsersService} from '../users/users.service';
// import {PipelineDto} from './dto/pipeline.dto';
// import {Pipeline} from './pipeline.model';
// import {PipelinesController} from './pipelines.controller';
// import {PipelinesService} from './pipelines.service';

// // This allows basic testing of the pipelines controller
// // interface without having to construct a full File object
// /* eslint-disable @typescript-eslint/ban-ts-comment */
// //@ts-ignore
// const mockFile: Express.Multer.File = {
//   originalname: 'abc.json',
//   buffer: Buffer.from('{}')
// };
// //@ts-ignore
// const secondMockFile: Express.Multer.File = {
//   originalname: 'cda.json',
//   buffer: Buffer.from('{}')
// };
// /* eslint-enable @typescript-eslint/ban-ts-comment */

// describe('PipelinesController', () => {
//   let pipelinesController: PipelinesController;
//   let pipelinesService: PipelinesService;
//   let module: TestingModule;
//   let databaseService: DatabaseService;
//   let usersService: UsersService;
//   let groupsService: GroupsService;

//   let user: User;

//   beforeAll(async () => {
//     module = await Test.createTestingModule({
//       controllers: [PipelinesController],
//       imports: [
//         DatabaseModule,
//         SequelizeModule.forFeature([
//           PipelineTag,
//           Pipeline,
//           User,
//           GroupPipeline,
//           GroupUser,
//           Group
//         ])
//       ],
//       providers: [
//         AuthzService,
//         ConfigService,
//         DatabaseService,
//         UsersService,
//         PipelinesService,
//         GroupsService
//       ]
//     }).compile();

//     databaseService = module.get<DatabaseService>(DatabaseService);
//     pipelinesService = module.get<PipelinesService>(PipelinesService);
//     pipelinesController = module.get<PipelinesController>(
//       PipelinesController
//     );
//     usersService = module.get<UsersService>(UsersService);
//     groupsService = module.get<GroupsService>(GroupsService);
//   });

//   beforeEach(async () => {
//     await databaseService.cleanAll();
//     user = await usersService.create(CREATE_USER_DTO_TEST_OBJ);
//   });

//   describe('findById', () => {
//     it('should return an pipeline', async () => {
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: user.id
//       });

//       const foundPipeline = await pipelinesController.findById(
//         pipeline.id,
//         {user: user}
//       );

//       expect(foundPipeline).toEqual(
//         // The pipeline is created with the current user ID above
//         // so the expectation is that user should be able to edit
//         // which is the 2nd parameter to PipelineDto.
//         new PipelineDto(pipeline, true)
//       );
//     });

//     it('should return an pipelines tags', async () => {
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: mockFile,
//         userId: user.id
//       });

//       const foundPipeline = await pipelinesController.findById(
//         pipeline.id,
//         {user: user}
//       );
//       expect(foundPipeline.pipelineTags).toEqual(
//         new PipelineDto(pipeline).pipelineTags
//       );
//     });

//     it('should throw a not found exeception when given an invalid id', async () => {
//       expect.assertions(1);

//       await expect(
//         pipelinesController.findById('0', {user: user})
//       ).rejects.toBeInstanceOf(NotFoundException);
//     });

//     it('should prevent non-owners from viewing an pipeline', async () => {
//       expect.assertions(1);
//       const pipelineOwner = await usersService.create(
//         CREATE_USER_DTO_TEST_OBJ_2
//       );
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: pipelineOwner.id
//       });
//       await expect(
//         pipelinesController.findById(pipeline.id, {user: user})
//       ).rejects.toBeInstanceOf(ForbiddenError);
//     });
//   });

//   describe('findAll', () => {
//     it('should return all pipelines a user has permissions to read', async () => {
//       await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: user.id
//       });
//       let foundPipelines = await pipelinesController.findAll({user: user});
//       expect(foundPipelines.length).toEqual(1);
//       const pipelineOwner = await usersService.create(
//         CREATE_USER_DTO_TEST_OBJ_2
//       );
//       await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: pipelineOwner.id
//       });
//       foundPipelines = await pipelinesController.findAll({user: user});
//       expect(foundPipelines.length).toEqual(1);
//     });

//     it('should return all pipelines and their associated tags', async () => {
//       await pipelinesService.create({
//         ...EVALUATION_WITH_TAGS_1,
//         data: mockFile,
//         userId: user.id
//       });
//       const foundPipelines = await pipelinesController.findAll({
//         user: user
//       });
//       expect(foundPipelines[0].pipelineTags.length).toEqual(1);
//     });

//     it('should return editable true if the user is the owner of an pipeline', async () => {
//       await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: user.id
//       });
//       const foundPipelines = await pipelinesController.findAll({
//         user: user
//       });
//       expect(foundPipelines[0].editable).toBeTruthy();
//     });

//     it('should return editable true if the user is the owner of a group that an pipeline belongs to', async () => {
//       const pipelineOwner = await usersService.create(
//         CREATE_USER_DTO_TEST_OBJ_2
//       );
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: pipelineOwner.id
//       });
//       const group = await groupsService.create(PRIVATE_GROUP);
//       await groupsService.addUserToGroup(group, user, 'owner');
//       await groupsService.addPipelineToGroup(group, pipeline);
//       const foundPipelines = await pipelinesController.findAll({
//         user: user
//       });

//       expect(foundPipelines[0].editable).toBeTruthy();
//     });

//     it('should return editable false if the user is not owner of a group that an pipeline belongs to', async () => {
//       const pipelineOwner = await usersService.create(
//         CREATE_USER_DTO_TEST_OBJ_2
//       );
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: pipelineOwner.id
//       });
//       const group = await groupsService.create(GROUP_1);
//       const group2 = await groupsService.create(PRIVATE_GROUP);
//       await groupsService.addUserToGroup(group, user, 'user');
//       await groupsService.addUserToGroup(group2, user, 'owner');
//       await groupsService.addPipelineToGroup(group, pipeline);
//       const foundPipelines = await pipelinesController.findAll({
//         user: user
//       });
//       expect(foundPipelines[0].editable).toBeFalsy();
//     });
//   });

//   describe('create', () => {
//     it('should allow a user to create an pipeline', async () => {
//       const pipeline = await pipelinesController.create(
//         EVALUATION_WITH_TAGS_1,
//         [mockFile],
//         {user: user}
//       );
//       expect(pipeline).toBeDefined();
//       if (Array.isArray(pipeline)) {
//         throw new Error(
//           'Returned pipeline for one file upload should not be an array'
//         );
//       }
//       expect(pipeline.pipelineTags.length).toEqual(1);
//       // Creating an pipeline should return a DTO without data.
//       expect(pipeline.data).not.toBeDefined();
//     });

//     it('should create an pipeline without tags', async () => {
//       const pipeline = await pipelinesController.create(
//         CREATE_EVALUATION_DTO_WITHOUT_TAGS,
//         [mockFile],
//         {user: user}
//       );
//       expect(pipeline).toBeDefined();
//       if (Array.isArray(pipeline)) {
//         throw new Error(
//           'Returned pipeline for one file upload should not be an array'
//         );
//       }
//       expect(pipeline.pipelineTags.length).toEqual(0);
//     });

//     it('should accept multiple pipelines', async () => {
//       const pipelines = await pipelinesController.create(
//         EVALUATION_WITH_TAGS_1,
//         [mockFile, secondMockFile],
//         {user: user}
//       );
//       expect(pipelines).toBeDefined();
//       if (!Array.isArray(pipelines)) {
//         throw new Error(
//           'Returned pipeline for multiple file upload should be an array'
//         );
//       }
//       expect(pipelines.length).toEqual(2);
//       expect(pipelines[0].filename).toEqual(mockFile.originalname);
//       expect(pipelines[1].filename).toEqual(secondMockFile.originalname);
//       // Creating an pipeline should return a DTO without data.
//       expect(pipelines[0].data).not.toBeDefined();
//     });
//   });

//   describe('update', () => {
//     it('should allow an pipeline owner to update', async () => {
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: user.id
//       });
//       const updatedPipeline = await pipelinesController.update(
//         pipeline.id,
//         {user: user},
//         UPDATE_EVALUATION
//       );
//       expect(pipeline.filename).not.toEqual(updatedPipeline.filename);
//       expect(pipeline.data).not.toEqual(updatedPipeline.data);
//     });

//     it('should allow a group owner to update', async () => {
//       const privateGroup = await groupsService.create(PRIVATE_GROUP);
//       const owner = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);

//       await groupsService.addUserToGroup(privateGroup, owner, 'owner');

//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: user.id
//       });

//       await groupsService.addPipelineToGroup(privateGroup, pipeline);

//       const updatedPipeline = await pipelinesController.update(
//         pipeline.id,
//         {user: owner},
//         UPDATE_EVALUATION
//       );
//       expect(pipeline.filename).not.toEqual(updatedPipeline.filename);
//       expect(pipeline.data).not.toEqual(updatedPipeline.data);
//     });

//     it('should prevent unauthorized group users from updating an evalution in a group they belong to', async () => {
//       expect.assertions(1);

//       const privateGroup = await groupsService.create(PRIVATE_GROUP);
//       const owner = await usersService.create(CREATE_ADMIN_DTO);
//       const basicUser = await usersService.create(CREATE_USER_DTO_TEST_OBJ_2);

//       await groupsService.addUserToGroup(privateGroup, owner, 'owner');
//       await groupsService.addUserToGroup(privateGroup, basicUser, 'user');

//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: user.id
//       });

//       await groupsService.addPipelineToGroup(privateGroup, pipeline);

//       await expect(
//         pipelinesController.update(
//           pipeline.id,
//           {user: basicUser},
//           UPDATE_EVALUATION
//         )
//       ).rejects.toBeInstanceOf(ForbiddenError);
//     });

//     it('should prevent unauthorized users from updating', async () => {
//       expect.assertions(1);
//       const pipelineOwner = await usersService.create(
//         CREATE_USER_DTO_TEST_OBJ_2
//       );
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: pipelineOwner.id
//       });
//       await expect(
//         pipelinesController.update(
//           pipeline.id,
//           {user: user},
//           UPDATE_EVALUATION
//         )
//       ).rejects.toBeInstanceOf(ForbiddenError);
//     });
//   });

//   describe('remove', () => {
//     it('should remove an pipeline', async () => {
//       expect.assertions(1);
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: {},
//         userId: user.id
//       });
//       await pipelinesController.remove(pipeline.id, {user: user});
//       await expect(
//         pipelinesController.findById(pipeline.id, {user: user})
//       ).rejects.toBeInstanceOf(NotFoundException);
//     });

//     it('should prevent unauthorized users removing an pipeline', async () => {
//       expect.assertions(1);
//       const pipelineOwner = await usersService.create(
//         CREATE_USER_DTO_TEST_OBJ_2
//       );
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: pipelineOwner.id
//       });
//       await expect(
//         pipelinesController.remove(pipeline.id, {user: user})
//       ).rejects.toBeInstanceOf(ForbiddenError);
//     });
//   });

//   describe('groups for pipeline', () => {
//     it('should return groups the pipeline belongs to that the requesting user can add and remove the pipeline from', async () => {
//       const pipelineOwner = await usersService.create(
//         CREATE_USER_DTO_TEST_OBJ_2
//       );
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: pipelineOwner.id
//       });
//       const group = await groupsService.create(GROUP_1);
//       await groupsService.addUserToGroup(group, user, 'member');
//       await groupsService.addPipelineToGroup(group, pipeline);
//       const foundGroups = await pipelinesController.groupsForPipeline(
//         pipeline.id,
//         {user: user}
//       );
//       expect(foundGroups[0].id).toEqual(group.id);
//     });

//     it('should not return groups the user has no access to', async () => {
//       // GROUP_1 is a public group and still should not show up.
//       const pipelineOwner = await usersService.create(
//         CREATE_USER_DTO_TEST_OBJ_2
//       );
//       const pipeline = await pipelinesService.create({
//         ...EVALUATION_1,
//         data: mockFile,
//         userId: pipelineOwner.id
//       });
//       const group = await groupsService.create(GROUP_1);
//       await groupsService.addPipelineToGroup(group, pipeline);
//       const foundGroups = await pipelinesController.groupsForPipeline(
//         pipeline.id,
//         {user: user}
//       );
//       expect(foundGroups.length).toEqual(0);
//     });
//   });

//   afterAll(async () => {
//     await databaseService.cleanAll();
//     await databaseService.closeConnection();
//   });
// });
