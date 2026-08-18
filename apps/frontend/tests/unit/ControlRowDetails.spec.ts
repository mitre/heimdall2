import ControlRowDetails from '@/components/cards/controltable/ControlRowDetails.vue';
import {mount, Wrapper} from '@vue/test-utils';
import {ContextualizedControl} from 'inspecjs';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import Vue from 'vue';
import Vuetify from 'vuetify';
import {addElemWithDataAppToBody} from '../util/testingUtils';

const mocks = vi.hoisted(() => ({
  updateControlComments: vi.fn()
}));

vi.mock('@/store/data_store', () => ({
  InspecDataModule: {
    updateControlComments: mocks.updateControlComments
  }
}));

addElemWithDataAppToBody();

describe('ControlRowDetails', () => {
  const vuetify = new Vuetify();
  let control: ContextualizedControl;
  let wrapper: Wrapper<Vue>;

  beforeEach(() => {
    mocks.updateControlComments.mockReset();
    control = {
      data: {
        id: 'V-1',
        title: 'Control title',
        desc: 'Control description',
        impact: 0.5,
        tags: {},
        refs: []
      },
      full_code: '',
      hdf: {
        descriptions: {},
        isProfile: false,
        rawNistTags: [],
        wraps: {
          tags: {}
        }
      },
      root: {
        data: {
          tags: {}
        },
        hdf: {
          finding_details: 'Finding details',
          segments: [{status: 'passed'}],
          severity: 'medium'
        }
      }
    } as unknown as ContextualizedControl;

    wrapper = mount(ControlRowDetails, {
      vuetify,
      propsData: {
        control
      },
      stubs: {
        ControlRowCol: true,
        prism: true
      }
    });
  });

  it('always shows an editable comments field on the Test tab', () => {
    expect(wrapper.text()).toContain('Comments:');
    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('updates control comments from the Test tab comments field', async () => {
    await wrapper.find('textarea').setValue('review note');

    expect(mocks.updateControlComments).toHaveBeenCalledWith({
      comments: 'review note',
      control
    });
  });
});
