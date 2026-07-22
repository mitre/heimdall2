import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Vuetify from 'vuetify';
import LocalLogin from '@/components/global/login/LocalLogin.vue';

const server = vi.hoisted(() => ({
  enabledOAuth: ['oidc', 'okta'],
  localLoginEnabled: true,
  oidcName: 'Acme SSO',
  registrationEnabled: true,
}));

vi.mock('@/store/server', () => ({ ServerModule: server }));
vi.mock('@/store/snackbar', () => ({ SnackbarModule: { notify: vi.fn() } }));

const browserStorage = document.defaultView?.localStorage;
if (!browserStorage) {
  throw new TypeError('The LocalLogin tests require browser local storage');
}
const PROVIDER_STORAGE_KEY = 'authentication_provider';

describe.sequential('LocalLogin registration and OAuth provider state', () => {
  const vuetify = new Vuetify();

  const mountLogin = () =>
    mount(LocalLogin, {
      stubs: ['router-link'],
      vuetify,
    });

  beforeEach(() => {
    browserStorage.clear();
    server.localLoginEnabled = true;
    server.registrationEnabled = true;
  });

  it.each([
    ['unset', true],
    ['false', true],
    ['sso', true],
    ['true', false],
    ['local', false],
  ])(
    'shows Sign Up for the REGISTRATION_DISABLED=%s startup setting: %s',
    (_value, registrationEnabled) => {
      server.registrationEnabled = registrationEnabled;

      const wrapper = mountLogin();

      expect(wrapper.find('#sign_up_button').exists()).toBe(
        registrationEnabled,
      );
    },
  );

  it.each([
    ['okta', 'Okta'],
    ['oidc', 'Acme SSO'],
  ])('persists the clicked %s provider name before redirect', async (site, name) => {
    const wrapper = mountLogin();

    await wrapper.find(`#oauth-${site}`).trigger('click');

    expect(browserStorage.getItem(PROVIDER_STORAGE_KEY)).toBe(
      JSON.stringify(name),
    );
  });
});
