import {vi} from 'vitest';
import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

vi.mock('vue-apexcharts', () => ({
  default: {
    name: 'ApexChart',
    render(h) {
      return h('div');
    }
  }
}));
