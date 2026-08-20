import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Vuetify from 'vuetify';
import LDAPLogin from '@/components/global/login/LDAPLogin.vue';
import Login from '@/views/Login.vue';

const mocks = vi.hoisted(() => ({
  failure: vi.fn(),
  routerPush: vi.fn(),
  server: {
    enabledOAuth: ['okta'],
    ldap: true,
    localLoginEnabled: true,
    token: '',
  },
}));

vi.mock('@/store/server', () => ({ ServerModule: mocks.server }));
vi.mock('@/store/snackbar', () => ({ SnackbarModule: { failure: mocks.failure } }));

const browserStorage = document.defaultView?.localStorage;
if (!browserStorage) {
  throw new TypeError('The Login tests require browser local storage');
}
const ACCOUNT_NOT_PROVISIONED = 'account_not_provisioned';
const PROVIDER_STORAGE_KEY = 'authentication_provider';
const AUTHENTICATION_ERROR
  = 'No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.';
const normalizeText = (value: string) => value.replaceAll(/\s+/gv, ' ').trim();

describe.sequential('Login provisioning denial rendering', () => {
  const cookies = new Map<string, string>();
  const cookieJar = {
    get: vi.fn((name: string) => cookies.get(name)),
    remove: vi.fn((name: string) => cookies.delete(name)),
  };
  const vuetify = new Vuetify();

  const mountLogin = () =>
    shallowMount(Login, {
      mocks: {
        $cookies: cookieJar,
        $router: { push: mocks.routerPush },
      },
      vuetify,
    });

  beforeEach(() => {
    cookies.clear();
    browserStorage.clear();
    vi.clearAllMocks();
  });

  it('renders only the provider-named alert for the OAuth account_not_provisioned cookie', async () => {
    cookies.set('authenticationError', AUTHENTICATION_ERROR);
    cookies.set('authenticationErrorCode', ACCOUNT_NOT_PROVISIONED);
    browserStorage.setItem(
      PROVIDER_STORAGE_KEY,
      JSON.stringify('Okta'),
    );

    const wrapper = mountLogin();
    await wrapper.vm.$nextTick();
    const alert = wrapper.find('#account_not_provisioned_alert');

    expect(normalizeText(alert.text())).toBe(
      'Sign-in not completed Your Okta identity was verified, but no Heimdall account exists for you. Contact your Heimdall administrator to request an account.',
    );
    expect(alert.text()).not.toContain('REGISTRATION_DISABLED');
    expect(mocks.failure).not.toHaveBeenCalled();
    expect(cookieJar.remove).toHaveBeenCalledWith('authenticationError');
    expect(cookieJar.remove).toHaveBeenCalledWith('authenticationErrorCode');
    expect(
      browserStorage.getItem(PROVIDER_STORAGE_KEY),
    ).toBeNull();
  });

  it.each([
    ['without a code', undefined],
    ['with an unknown code', 'external_identity_missing_email'],
  ])('keeps the generic OAuth failure %s', (_description, code) => {
    cookies.set('authenticationError', 'Provider returned a generic failure');
    if (code) {
      cookies.set('authenticationErrorCode', code);
    }

    const wrapper = mountLogin();

    expect(wrapper.find('#account_not_provisioned_alert').exists()).toBe(
      false,
    );
    expect(mocks.failure).toHaveBeenCalledExactlyOnceWith(
      'Sorry, a problem occurred while signing you in. The reason given was: Provider returned a generic failure',
    );
    expect(cookieJar.remove).toHaveBeenCalledWith('authenticationError');
    expect(cookieJar.remove).toHaveBeenCalledWith('authenticationErrorCode');
  });

  it('uses the same dedicated alert for an LDAP denial event', async () => {
    const wrapper = mountLogin();

    wrapper.findComponent(LDAPLogin).vm.$emit('account-not-provisioned', 'LDAP');
    await wrapper.vm.$nextTick();

    expect(
      normalizeText(wrapper.find('#account_not_provisioned_alert').text()),
    ).toBe(
      'Sign-in not completed Your LDAP identity was verified, but no Heimdall account exists for you. Contact your Heimdall administrator to request an account.',
    );
    expect(mocks.failure).not.toHaveBeenCalled();
  });
});
