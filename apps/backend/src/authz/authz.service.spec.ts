import {describe, expect, it} from 'vitest';
import {AuthzService} from './authz.service';
import {CaslAbilityFactory, Action} from '../casl/casl-ability.factory';
import {subject} from '@casl/ability';

describe('AuthzService', () => {
  it('exposes a CaslAbilityFactory instance on the abac property', () => {
    const service = new AuthzService();
    expect(service.abac).toBeInstanceOf(CaslAbilityFactory);
  });

  it('createForUser returns an ability that can check permissions', () => {
    const service = new AuthzService();
    const ability = service.abac.createForUser({id: '1', role: 'admin'});
    expect(ability.can(Action.Manage, subject('User', {id: '99'}))).toBe(true);
  });

  it('createForUser grants admin ViewStatistics on all', () => {
    const service = new AuthzService();
    const ability = service.abac.createForUser({id: '1', role: 'admin'});
    expect(ability.can(Action.ViewStatistics, 'all')).toBe(true);
  });

  it('createForUser denies non-admin ViewStatistics', () => {
    const service = new AuthzService();
    const ability = service.abac.createForUser({id: '42', role: 'user'});
    expect(ability.can(Action.ViewStatistics, 'all')).toBe(false);
  });

  it('createForAnonymous returns an ability that denies everything', () => {
    const service = new AuthzService();
    const ability = service.abac.createForAnonymous();
    expect(ability.can(Action.Manage, 'all')).toBe(false);
    expect(ability.can(Action.Read, 'User')).toBe(false);
    expect(ability.can(Action.ViewStatistics, 'all')).toBe(false);
  });

  it('admin cannot manage their own User subject', () => {
    const service = new AuthzService();
    const ability = service.abac.createForUser({id: '1', role: 'admin'});
    expect(ability.can(Action.Manage, subject('User', {id: '1'}))).toBe(false);
  });

  it('regular user can read/update/delete their own User', () => {
    const service = new AuthzService();
    const ability = service.abac.createForUser({id: '42', role: 'user'});
    const self = subject('User', {id: '42', email: 'me@test.com'});
    expect(ability.can(Action.Read, self)).toBe(true);
    expect(ability.can(Action.Update, self)).toBe(true);
    expect(ability.can(Action.Delete, self)).toBe(true);
  });
});
