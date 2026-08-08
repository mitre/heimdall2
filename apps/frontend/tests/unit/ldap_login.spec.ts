import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Vuetify from 'vuetify';
import LDAPLogin from '@/components/global/login/LDAPLogin.vue';

const mocks = vi.hoisted(() => ({
  httpFailure: vi.fn(),
  loginLDAP: vi.fn(),
  notify: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock('@/store/server', () => ({ ServerModule: { LoginLDAP: mocks.loginLDAP } }));
vi.mock('@/store/snackbar', () => ({
  SnackbarModule: {
    HTTPFailure: mocks.httpFailure,
    notify: mocks.notify,
  },
}));

describe.sequential('LDAPLogin provisioning denial transport', () => {
  const vuetify = new Vuetify();

  const mountLogin = () =>
    mount(LDAPLogin, {
      mocks: { $router: { push: mocks.routerPush } },
      vuetify,
    });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits the LDAP alert and suppresses the generic snackbar for account_not_provisioned', async () => {
    mocks.loginLDAP.mockRejectedValue({ response: { data: { error: 'account_not_provisioned' }, status: 401 } });
    const wrapper = mountLogin();

    await wrapper.find('#login_button').trigger('click');
    await vi.waitFor(() => {
      expect(mocks.loginLDAP).toHaveBeenCalledOnce();
    });

    expect(wrapper.emitted('account-not-provisioned')).toEqual([['LDAP']]);
    expect(mocks.httpFailure).not.toHaveBeenCalled();
    expect(mocks.routerPush).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });

  it('leaves an unrecognized LDAP failure on the existing generic path', async () => {
    mocks.loginLDAP.mockRejectedValue({ response: { data: { error: 'Unauthorized' }, status: 401 } });
    const wrapper = mountLogin();

    await wrapper.find('#login_button').trigger('click');
    await vi.waitFor(() => {
      expect(mocks.loginLDAP).toHaveBeenCalledOnce();
    });
    await Promise.resolve();

    expect(mocks.httpFailure).toHaveBeenCalledExactlyOnceWith({ response: { data: { error: 'Unauthorized' }, status: 401 } });
    expect(wrapper.emitted('account-not-provisioned')).toBeUndefined();
    expect(mocks.routerPush).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});
