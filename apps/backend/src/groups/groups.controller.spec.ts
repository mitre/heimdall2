import { Test } from '@nestjs/testing';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

describe('GroupsController', () => {
  let groupsController: GroupsController;
  let groupsService: GroupsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [GroupsController],
      providers: [GroupsService],
    }).compile();

    groupsService = module.get<GroupsService>(GroupsService);
    groupsController = module.get<GroupsController>(GroupsController);
  });

  describe('create', () => {
    it('should create a group given a valid DTO', async () => {
      const result = ['test'];
      jest.spyOn(GroupsService, 'create').mockImplementation(() => result);

      expect(await Controller.findAll()).toBe(result);
    });
  });
});
