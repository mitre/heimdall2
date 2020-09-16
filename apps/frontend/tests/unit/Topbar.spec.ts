import {shallowMount} from '@vue/test-utils';
import sinon from 'sinon';
import Topbar from '@/components/global/Topbar.vue';
import Vuetify from 'vuetify';
import {ServerModule} from '@/store/server';

jest.mock('@/store/server');
const BackendModStub = sinon.stub(ServerModule);

describe('Logout button', () => {
  const vuetify = new Vuetify();

  afterEach(function() {
    sinon.restore();
  });

  it('Hides the Logout button when the application is not in Server Mode', () => {
    BackendModStub.serverMode = false;
    // Mounting the component has to happen after setting up the serverMode
    const wrapper = shallowMount(Topbar, {vuetify});

    expect(wrapper.find('#logout').exists()).toBe(false);
  });

  it('Displays a Logout button when the application is in Server Mode', () => {
    BackendModStub.serverMode = true;
    // Mounting the component has to happen after setting up the serverMode
    const wrapper = shallowMount(Topbar, {vuetify});

    expect(wrapper.find('#logout').exists()).toBe(true);
  });
});
