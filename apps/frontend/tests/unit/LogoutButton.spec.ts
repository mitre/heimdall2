import LogoutButton from '@/components/generic/LogoutButton.vue';
import {ServerModule} from '@/store/server';
import {shallowMount} from '@vue/test-utils';
import sinon from 'sinon';
import Vuetify from 'vuetify';

jest.mock('@/store/server');
const ServerModStub = sinon.stub(ServerModule);

describe('Logout button', () => {
  const vuetify = new Vuetify();

  afterEach(function () {
    sinon.restore();
  });

  it('Hides the Logout button when the application is not in Server Mode', () => {
    ServerModStub.serverMode = false;
    // Mounting the component has to happen after setting up the serverMode
    const wrapper = shallowMount(LogoutButton, {vuetify});

    expect(wrapper.find('#logout_button').exists()).toBe(false);
  });

  it('Displays a Logout button when the application is in Server Mode', () => {
    ServerModStub.serverMode = true;
    // Mounting the component has to happen after setting up the serverMode
    const wrapper = shallowMount(LogoutButton, {vuetify});

    expect(wrapper.find('#logout_button').exists()).toBe(true);
  });
});
