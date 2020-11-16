import ControlRowCol from '@/components/cards/controltable/ControlRowCol.vue';
import {mount, Wrapper} from '@vue/test-utils';
import Vuetify from 'vuetify';
import {addElemWithDataAppToBody} from '../util/testingUtils';

addElemWithDataAppToBody();

describe('The Topbar', () => {
  const vuetify = new Vuetify();
  let wrapper: Wrapper<Vue>;

  beforeEach(() => {
    wrapper = mount(ControlRowCol, {
      vuetify,
      propsData: {
        statusCode: 'passed',
        result: {
          status: 'passed',
          message: 'This is the message',
          code_desc: 'This is the code description',
          start_time: '2020-01-01T12:12:12+05:00'
        }
      }
    });
  });

  it('displays the result message', async () => {
    expect(wrapper.text()).toContain('This is the message');
  });

  it('displays the proper status', async () => {
    expect(wrapper.get('button.statuspassed').text()).toEqual('PASSED');
  });
});
