/**
 * ADR-008 Phase 1 — login must not block on application data.
 *
 * Regression under test: `14c13a0e9` turned three fire-and-forget calls into an
 * awaited chain inside `GetUserInfo`, so a rejecting `GET /groups/my` propagates
 * out of every login entry path and the caller's `router.push` never runs
 * (`LocalLogin.vue:194-197`). Local, LDAP, all five OAuth providers and page
 * reload all funnel through `GetUserInfo`, which is why these specs drive the
 * store rather than a component.
 *
 * These are `describe.sequential`: `vitest.config.mts` sets `sequence.concurrent`
 * and every spec in this suite shares ONE Vuex store, so a concurrent sibling
 * would observe this file's mutations mid-assertion.
 */
import LocalLogin from '@/components/global/login/LocalLogin.vue';
import {GroupsModule} from '@/store/groups';
import {ServerModule} from '@/store/server';
import type {IGroup, IStartupSettings, IUser} from '@heimdall/common/interfaces';
import {mount} from '@vue/test-utils';
import Vuetify from 'vuetify';
import {addElemWithDataAppToBody} from '../util/testing-utils';
import axios from 'axios';
import Vue from 'vue';
import vueCookiesPlugin from 'vue-cookies';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// main.ts registers this and the unit suite never loads main.ts. CheckForServer
// calls Vue.$cookies.remove() UNCONDITIONALLY (server.ts:176-177), so without
// the plugin it throws a TypeError into its own catch — which is written for
// "the server said no" — and silently returns before reaching GetUserInfo.
Vue.use(vueCookiesPlugin);
addElemWithDataAppToBody();

const USER: IUser = {
  id: '1',
  email: 'admin@example.com',
  firstName: 'Ada',
  lastName: 'Admin',
  title: 'Admin',
  role: 'admin',
  organization: 'MITRE',
  loginCount: 1,
  lastLogin: undefined,
  creationMethod: 'local',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01')
};

const GROUP: IGroup = {
  id: '7',
  name: 'All Groups Entry',
  public: true,
  users: [],
  desc: 'returned by GET /groups',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01')
};

const STARTUP: IStartupSettings = {
  apiKeysEnabled: false,
  banner: '',
  classificationBannerColor: '',
  classificationBannerText: '',
  classificationBannerTextColor: '',
  enabledOAuth: [],
  externalUrl: '',
  oidcName: '',
  ldap: true,
  registrationEnabled: true,
  localLoginEnabled: true,
  tenableHostUrl: '',
  forceTenableFrontend: false,
  splunkHostUrl: ''
};

/** The failure the regression turns into a lockout. */
const MY_GROUPS_FAILURE = new Error('Request failed with status code 500');

/** The user-directory prefetch — the other secondary call GetUserInfo makes. */
const ALL_USERS_FAILURE = new Error('Request failed with status code 503');

interface GetCall {
  url: string;
}

/**
 * Which secondary fetch fails. Both must be covered independently: making
 * FetchGroupData settled fixes `/groups/my` on its own, so a suite that only
 * fails that endpoint cannot tell whether GetUserInfo still awaits the
 * secondary calls — a mutation reverting the un-awaiting survived until
 * `all-users` existed.
 */
type FailingEndpoint = 'my-groups' | 'all-users';

/**
 * Route every GET the login chain makes. `/groups/my` is the default failure —
 * the same endpoint `3bdd1f146` broke in production, which is how this class of
 * defect was found.
 */
function stubApi(fail: FailingEndpoint = 'my-groups'): {calls: GetCall[]} {
  const calls: GetCall[] = [];

  vi.spyOn(axios, 'get').mockImplementation((path) => {
    calls.push({url: path});

    if (path === '/server') {
      return Promise.resolve({status: 200, data: STARTUP});
    }
    if (path === '/users/user-find-all') {
      return fail === 'all-users'
        ? Promise.reject(ALL_USERS_FAILURE)
        : Promise.resolve({data: []});
    }
    if (path.startsWith('/users/')) {
      // A COPY, never the fixture itself. SET_USER_INFO stores the reference it
      // is given, so handing over the fixture lets a later SET_USERID('') mutate
      // it — which silently emptied USER.id and made every later spec pass by
      // early-returning out of GetUserInfo instead of exercising it.
      return Promise.resolve({data: {...USER}});
    }
    if (path === '/groups') {
      return Promise.resolve({data: [{...GROUP}]});
    }
    if (path === '/groups/my') {
      return fail === 'my-groups'
        ? Promise.reject(MY_GROUPS_FAILURE)
        : Promise.resolve({data: []});
    }
    return Promise.reject(new Error(`unstubbed GET ${path}`));
  });

  vi.spyOn(axios, 'post').mockImplementation((path) => {
    if (path === '/authn/login' || path === '/authn/login/ldap') {
      return Promise.resolve({data: {userID: USER.id, accessToken: 'jwt.abc'}});
    }
    return Promise.reject(new Error(`unstubbed POST ${path}`));
  });

  return {calls};
}

/** Put both stores back to their construction-time state. */
function resetStores(): void {
  ServerModule.SET_TOKEN('');
  // SET_USER_INFO first: SET_USERID writes through to userInfo.id, so clearing
  // the object afterwards would discard it.
  ServerModule.SET_USER_INFO({...USER, id: '', role: ''});
  ServerModule.SET_USERID('');
  ServerModule.SET_LOADING(true);
  GroupsModule.SET_ALL_GROUPS([]);
  GroupsModule.SET_MY_GROUPS([]);
  GroupsModule.SET_LOADING(true);
}

describe.sequential('login must not block on application data (ADR-008)', () => {
  beforeEach(() => {
    resetStores();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Login() resolves when GET /groups/my rejects — the local path', async () => {
    const {calls} = stubApi();

    // LocalLogin.vue:194 awaits this; :197 pushes the route only if it resolves.
    await expect(
      ServerModule.Login({email: USER.email, password: 'password'})
    ).resolves.toBeUndefined();

    // Without this the test is vacuous: a stub-routing slip or an early return
    // would resolve the promise without ever reaching the failing endpoint.
    expect(calls.map((c) => c.url)).toContain('/groups/my');
  });

  it('LoginLDAP() resolves when GET /groups/my rejects — the LDAP path', async () => {
    const {calls} = stubApi();

    // LDAPLogin.vue:77 has no try at all, so a rejection here is unhandled.
    await expect(
      ServerModule.LoginLDAP({username: 'ada', password: 'password'})
    ).resolves.toBeUndefined();

    expect(calls.map((c) => c.url)).toContain('/groups/my');
  });

  it('Login() resolves when GET /users/user-find-all rejects', async () => {
    const {calls} = stubApi('all-users');

    // The OTHER secondary fetch. Settled group semantics cannot rescue this
    // one, so it is what proves GetUserInfo stopped AWAITING the secondary
    // calls rather than merely stopping one of them from rejecting.
    await expect(
      ServerModule.Login({email: USER.email, password: 'password'})
    ).resolves.toBeUndefined();

    expect(calls.map((c) => c.url)).toContain('/users/user-find-all');
  });

  it('CheckForServer() resolves and commits server mode when GET /groups/my rejects', async () => {
    const {calls} = stubApi();
    // CheckForServer reads the token and userID back out of localStorage
    // (server.ts:173-174). Both must be truthy or it falls through to
    // Vue.$cookies, which this suite never registers — that throw lands in the
    // swallowing catch and GetUserInfo is never reached, which is the OAuth and
    // page-reload path this spec exists to cover.
    ServerModule.SET_TOKEN('jwt.abc');
    ServerModule.SET_USERID(USER.id);

    // router.ts:86 awaits this inside the guard for OAuth arrival and reload.
    await expect(ServerModule.CheckForServer()).resolves.not.toThrow();
    expect(ServerModule.serverMode).toBe(true);
    expect(calls.map((c) => c.url)).toContain('/groups/my');
  });

  it('commits the profile even though the group fetch fails', async () => {
    stubApi();

    await ServerModule.Login({email: USER.email, password: 'password'});

    // router.ts:99 reads this value for the requiresAdmin guard, so an admin
    // deep-linking to /admin depends on it surviving a failing group fetch.
    expect(ServerModule.userInfo.role).toBe('admin');
    expect(ServerModule.userInfo.email).toBe(USER.email);
  });

  it('commits the groups that DID load when one list rejects', async () => {
    stubApi();

    // Driven directly and awaited, NOT through Login: Login deliberately no
    // longer awaits this, so asserting after it would be a race on microtask
    // ordering rather than a statement about settled semantics.
    await GroupsModule.FetchGroupData();

    // Promise.all was fail-fast, discarding the successful /groups response
    // because its sibling rejected.
    expect(GroupsModule.allGroups).toHaveLength(1);
    expect(GroupsModule.allGroups[0].name).toBe(GROUP.name);
    expect(GroupsModule.myGroups).toHaveLength(0);
    expect(GroupsModule.loading).toBe(false);
  });

  it('re-enters the loading state on every FetchGroupData, not just the first', async () => {
    stubApi();
    GroupsModule.SET_LOADING(false);

    const inFlight = GroupsModule.FetchGroupData();
    // groups.ts:26 initializes true and :122 sets it false once, never back —
    // so a refetch renders "loaded, empty" while it is still in flight.
    expect(GroupsModule.loading).toBe(true);

    await inFlight;
  });

  it('LocalLogin navigates into the app when GET /groups/my rejects', async () => {
    stubApi();
    const push = vi.fn();
    const wrapper = mount(LocalLogin, {
      vuetify: new Vuetify(),
      mocks: {$router: {push}},
      stubs: {'router-link': true}
    });

    const vm = wrapper.vm as unknown as {
      email: string;
      password: string;
      login(): Promise<void>;
    };
    vm.email = USER.email;
    vm.password = 'password';
    await vm.login();

    // The user-visible outcome. LocalLogin.vue:194-197 only pushes if the awaited
    // Login resolves, so promise settlement alone does not prove anyone gets in.
    expect(push).toHaveBeenCalledWith('/');
    wrapper.destroy();
  });

  it('runs the CheckForServer body once per page load, not once per navigation', async () => {
    const {calls} = stubApi();
    ServerModule.SET_TOKEN('jwt.abc');
    ServerModule.SET_USERID(USER.id);

    await ServerModule.CheckForServer();
    await ServerModule.CheckForServer();
    await ServerModule.CheckForServer();

    // The !this.loading early return at server.ts:163 already provides this;
    // ADR-008 Decision §6 pins it rather than adding memoization.
    expect(calls.filter((c) => c.url === '/server')).toHaveLength(1);
  });
});
