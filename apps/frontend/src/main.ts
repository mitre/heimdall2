import 'core-js/stable';
import Vue from 'vue';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store/store';
import vuetify from '@/plugins/vuetify'; // path to vuetify export
import 'roboto-fontface/css/roboto/roboto-fontface.css';
//import "@mdi/font/css/materialdesignicons.css";
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import VueAnalytics from 'vue-analytics';

Vue.use(VueAnalytics, {
  id: 'UA-149784359-1',
  router,
  debug: {
    enabled: true,
    trace: false,
    sendHitTask: true
  }
});

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app');

// The following line is a hot patch to add regex support, theyre are better
// places to edit Prism variables, but could not locate them. Namely this is
// the Prism library variables, and not the Prism component variables
//@ts-ignore
Prism.languages.rb.string[5].pattern = /("|')(\1|(?:(?![^\\]\1)[\s\S])*[^\\]\1)/g;
