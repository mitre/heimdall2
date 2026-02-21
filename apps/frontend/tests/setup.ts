import {vi} from 'vitest';
import Vue, {CreateElement} from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

vi.mock('vue-apexcharts', () => ({
  default: {
    name: 'ApexChart',
    render(h: CreateElement) {
      return h('div');
    }
  }
}));
