import type { Wrapper } from '@vue/test-utils';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import type Vue from 'vue';
import Vuetify from 'vuetify';
import ControlRowCol from '@/components/cards/controltable/ControlRowCol.vue';
import { addElemWithDataAppToBody } from '../util/testingUtils';

addElemWithDataAppToBody();

describe('The Topbar', () => {
  const vuetify = new Vuetify();
  let wrapper: Wrapper<Vue>;

  beforeEach(() => {
    wrapper = mount(ControlRowCol, {
      propsData: {
        result: {
          code_desc: 'This is the code description',
          message: 'This is the message',
          startTime: '2020-01-01T12:12:12+05:00',
          status: 'passed',
        },
        statusCode: 'passed',
      },
      vuetify,
    });
  });

  it('displays the result message', async () => {
    expect(wrapper.text()).toContain('This is the message');
  });

  it('displays the proper status', async () => {
    expect(wrapper.get('button.statuspassed').text()).toEqual('PASSED');
  });
});
