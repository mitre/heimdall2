import UploadButton from '@/components/generic/UploadButton.vue';
import Modal from '@/components/global/Modal.vue';
import UploadNexus from '@/components/global/UploadNexus.vue';
import {mount, Wrapper} from '@vue/test-utils';
import Vuetify from 'vuetify';
import {addElemWithDataAppToBody} from '../util/testingUtils';

addElemWithDataAppToBody();

describe('The Upload Button', () => {
  const vuetify = new Vuetify();
  let wrapper: Wrapper<Vue>;

  beforeEach(() => {
    wrapper = mount(UploadButton, {
      vuetify
    });
  });

  it('Displays the UploadNexus and closes it when the close action is emitted', async () => {
    const uploadBtn = wrapper.find('#upload-btn');
    expect(wrapper.findComponent(UploadNexus).props('visible')).toBeFalsy();
    await uploadBtn.trigger('click');
    expect(wrapper.findComponent(UploadNexus).props('visible')).toBeTruthy();
    expect(uploadBtn.attributes('disabled')).toBeTruthy();
    wrapper.findComponent(Modal).vm.$emit('close-modal');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(UploadNexus).props('visible')).toBeFalsy();
    expect(uploadBtn.attributes('disabled')).toBeFalsy();
  });
});
