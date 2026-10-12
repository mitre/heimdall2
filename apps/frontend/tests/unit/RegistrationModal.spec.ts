import RegistrationModal from '@/components/global/RegistrationModal.vue';
import {ServerModule} from '@/store/server';
import {mount} from '@vue/test-utils';
import {describe, expect, it, vi} from 'vitest';
import Vue from 'vue';
import Vuelidate from 'vuelidate';
import Vuetify from 'vuetify';
import {addElemWithDataAppToBody} from '../util/testing-utils';

Vue.use(Vuelidate);
addElemWithDataAppToBody();

interface RegistrationForm {
  register(): Promise<void>;
  buttonLoading: boolean;
  $refs: {form: {validate(): boolean}};
}

describe('The registration modal', () => {
  const vuetify = new Vuetify();

  function mountForm(): RegistrationForm {
    const wrapper = mount(RegistrationModal, {
      vuetify,
      propsData: {visible: true}
    });
    return wrapper.vm as unknown as RegistrationForm;
  }

  it('leaves the button spinner off when validation fails', async () => {
    const vm = mountForm();
    vm.$refs.form.validate = () => false;
    await vm.register();
    expect(vm.buttonLoading).toBe(false);
  });

  it('resets the button spinner when registration fails', async () => {
    const register = vi
      .spyOn(ServerModule, 'Register')
      .mockRejectedValue(new Error('registration exploded'));
    try {
      const vm = mountForm();
      vm.$refs.form.validate = () => true;
      try {
        await vm.register();
      } catch {
        // register rejects when registration fails; the spinner reset
        // below is what this test pins.
      }
      expect(register).toHaveBeenCalledOnce();
      expect(vm.buttonLoading).toBe(false);
    } finally {
      register.mockRestore();
    }
  });
});
