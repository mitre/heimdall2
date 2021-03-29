import UploadButton from '@/components/generic/UploadButton.vue';
import {mount, Wrapper} from '@vue/test-utils';
import Vuetify from 'vuetify';
import {addElemWithDataAppToBody} from '../util/testingUtils';

addElemWithDataAppToBody();

describe('The Upload Button', () => {
  const vuetify = new Vuetify();
  let wrapper: Wrapper<Vue>;
  const $router = {
    currentRoute: {
      path: '/results'
    },
    push: function (newPath: string) {
      this.currentRoute.path = newPath;
    }
  };

  beforeEach(() => {
    wrapper = mount(UploadButton, {
      vuetify,
      mocks: {
        $router
      }
    });
  });

  it('Displays the UploadNexus', async () => {
    const uploadBtn = wrapper.find('#upload-btn');
    expect($router.currentRoute.path).toEqual('/results');
    await uploadBtn.trigger('click');
    expect($router.currentRoute.path).toEqual('/');
  });
});
