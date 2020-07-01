import {PolicyDto} from '../../src/authz/dto/policy.dto';

/* eslint-disable @typescript-eslint/ban-ts-ignore */

export const USER_DELETE_USERS_POLICY_DTO: PolicyDto = {
  role: 'user',
  actions: 'delete',
  targets: 'users'
};

export const USER_UPDATE_USERS_POLICY_DTO: PolicyDto = {
  role: 'user',
  actions: 'put',
  targets: 'users'
};

/* eslint-enable @typescript-eslint/ban-ts-ignore */
