import {Ability} from '@casl/ability';
import {
  ADMIN_WITH_ID,
  TEST_USER_WITH_ID
} from '../../test/constants/users-test.constant';
import {User} from '../users/user.model';
import {Action, CaslAbilityFactory} from './casl-ability.factory';

describe('CaslAbilityFactory', () => {
  let abilityFactory: CaslAbilityFactory;
  let userAbility: Ability;
  let adminAbility: Ability;

  beforeEach(async () => {
    abilityFactory = new CaslAbilityFactory();
    userAbility = abilityFactory.createForUser(TEST_USER_WITH_ID);
    adminAbility = abilityFactory.createForUser(ADMIN_WITH_ID);
  });

  it('should allow users to get, put and delete their own user', () => {
    expect(
      userAbility.can(
        Action.Read,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
    expect(
      userAbility.can(
        Action.Update,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
    expect(
      userAbility.can(
        Action.Delete,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
  });

  it('should not allow users to perform special admin actions', () => {
    expect(
      userAbility.can(
        Action.DeleteNoPassword,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeFalsy();
    expect(
      userAbility.can(
        Action.UpdateNoPassword,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeFalsy();
    expect(
      userAbility.can(
        Action.SkipForcePasswordChange,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeFalsy();
    expect(
      userAbility.can(
        Action.UpdateRole,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeFalsy();
  });

  it('should allow administrators to list all users', () => {
    expect(adminAbility.can(Action.Read, 'all')).toBeTruthy();
  });

  it('should allow administrators to delete users without providing password except themselves', () => {
    expect(
      adminAbility.can(
        Action.Delete,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
    expect(
      adminAbility.can(
        Action.DeleteNoPassword,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
    expect(
      adminAbility.can(
        Action.DeleteNoPassword,
        Object.assign(User.prototype, ADMIN_WITH_ID)
      )
    ).toBeFalsy();
  });

  it('should allow administrators to update users', () => {
    expect(
      adminAbility.can(
        Action.Update,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
    expect(
      adminAbility.can(
        Action.Update,
        Object.assign(User.prototype, ADMIN_WITH_ID)
      )
    ).toBeTruthy();
  });

  it('should allow administrators to update users without providing password except themselves', () => {
    expect(
      adminAbility.can(
        Action.UpdateNoPassword,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
    expect(
      adminAbility.can(
        Action.UpdateNoPassword,
        Object.assign(User.prototype, ADMIN_WITH_ID)
      )
    ).toBeFalsy();
  });

  it('should allow administrators to skip a forced password change', () => {
    expect(
      adminAbility.can(
        Action.SkipForcePasswordChange,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
  });

  it('should allow administrators to update role', () => {
    expect(
      adminAbility.can(
        Action.UpdateRole,
        Object.assign(User.prototype, TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
  });
});
