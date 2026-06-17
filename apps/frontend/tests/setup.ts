import { vi } from 'vitest';
import type { CreateElement } from 'vue';
import Vue from 'vue';
import Vuetify from 'vuetify';

Vue.use(Vuetify);

vi.mock('vue-apexcharts', () => ({
  default: {
    name: 'ApexChart',
    render(h: CreateElement) {
      return h('div');
    },
  },
}));
