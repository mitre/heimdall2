import {CreateGroupDto} from '../../src/groups/dto/create-group.dto';

export const GROUP_1 = {
  name: 'Heimdall Group',
  public: true
};

export const PRIVATE_GROUP = {
  name: 'Private Heimdall Group',
  public: false
};

export const UPDATE_GROUP: CreateGroupDto = {
  name: 'Updated Group',
  public: true
};
