import {PolicyDto} from '../../src/authz/dto/policy.dto';
import {Policy} from 'src/authz/policy.model';

/* eslint-disable @typescript-eslint/ban-ts-ignore */

export const ADMIN_DELETE_USERS_POLICY_DTO: PolicyDto = {
  role: 'admin',
  actions: 'delete',
  targets: 'users'
};

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

// @ts-ignore
export const ADMIN_DELETE_USERS_POLICY: Policy = {
  id: 17,
  role: 'admin',
  actions: 'delete',
  targets: 'users',
  attributes: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

// @ts-ignore
export const USER_DELETE_USERS_POLICY: Policy = {
  id: 7,
  role: 'user',
  actions: 'delete',
  targets: 'users',
  attributes: null,
  createdAt: new Date(),
  updatedAt: new Date()
};

export const POLICY_ARRAY: Policy[] = [
  USER_DELETE_USERS_POLICY,
  ADMIN_DELETE_USERS_POLICY
];

/* eslint-enable @typescript-eslint/ban-ts-ignore */
