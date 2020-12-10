import {Ability, subject} from '@casl/ability';
import {
  ADMIN_WITH_ID,
  TEST_USER_WITH_ID
} from '../../test/constants/users-test.constant';
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

  it('should allow anyone to get, put and delete their own user', () => {
    expect(
      userAbility.can(Action.Read, subject('User', TEST_USER_WITH_ID))
    ).toBeTruthy();
    expect(
      userAbility.can(Action.Update, subject('User', TEST_USER_WITH_ID))
    ).toBeTruthy();
    expect(
      userAbility.can(Action.Delete, subject('User', TEST_USER_WITH_ID))
    ).toBeTruthy();
  });

  it('should not allow users to perform special admin actions', () => {
    expect(
      userAbility.can(
        Action.DeleteNoPassword,
        subject('User', TEST_USER_WITH_ID)
      )
    ).toBeFalsy();
    expect(
      userAbility.can(
        Action.UpdateNoPassword,
        subject('User', TEST_USER_WITH_ID)
      )
    ).toBeFalsy();
    expect(
      userAbility.can(
        Action.SkipForcePasswordChange,
        subject('User', TEST_USER_WITH_ID)
      )
    ).toBeFalsy();
    expect(
      userAbility.can(Action.UpdateRole, subject('User', TEST_USER_WITH_ID))
    ).toBeFalsy();
  });

  it('should allow administrators to list all users', () => {
    expect(adminAbility.can(Action.Read, 'all')).toBeTruthy();
  });

  it('should allow administrators to delete users without providing password except themselves', () => {
    expect(
      adminAbility.can(Action.Delete, subject('User', TEST_USER_WITH_ID))
    ).toBeTruthy();
    expect(
      adminAbility.can(
        Action.DeleteNoPassword,
        subject('User', TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
    expect(
      adminAbility.can(Action.DeleteNoPassword, subject('User', ADMIN_WITH_ID))
    ).toBeFalsy();
  });

  it('should allow administrators to update anyone', () => {
    expect(
      adminAbility.can(Action.Update, subject('User', TEST_USER_WITH_ID))
    ).toBeTruthy();
    expect(
      adminAbility.can(Action.Update, subject('User', ADMIN_WITH_ID))
    ).toBeTruthy();
  });

  it('should allow administrators to update users without providing password except themselves', () => {
    expect(
      adminAbility.can(
        Action.UpdateNoPassword,
        subject('User', TEST_USER_WITH_ID)
      )
    ).toBeTruthy();
    expect(
      adminAbility.can(Action.UpdateNoPassword, subject('User', ADMIN_WITH_ID))
    ).toBeFalsy();
  });

  // it('should allow administrators to skip a forced password change', () => {

  // });

  // it('should allow administrators to update role', () => {

  // });

  // it('should allow administrators to skip a forced password change', () => {

  // });

  // it('should allow administrators to create evaluations with no stipulations', () => {

  // });

  // it('should allow users to create evaluations that belong to their userId', () => {

  // });
});
