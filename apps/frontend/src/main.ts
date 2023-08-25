import App from '@/App.vue';
import vuetify from '@/plugins/vuetify';
import router from '@/router';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';
import store from '@/store/store';
import axios from 'axios';
import 'core-js/stable';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import Vue from 'vue';
import VueCookies from 'vue-cookies';
import Vuetify from 'vuetify/lib';
import {Resize} from 'vuetify/lib/directives';

Vue.config.productionTip = false;

Vue.use(VueCookies);
Vue.use(Vuetify, {
  directives: {
    Resize
  }
});

new Vue({
  router,
  store,
  vuetify,
  created() {
    axios.interceptors.response.use(
      (response) => response, // simply return the response
      (error) => {
        // If there is no backend token then it is safe to assume this request
        // originated from the login page and should not perform the logout action.
        if (ServerModule.token !== '' && error?.response?.status === 401) {
          // if we catch a 401 error
          ServerModule.Logout();
        } else {
          SnackbarModule.HTTPFailure(error);
        }
        return Promise.reject(error); // reject the Promise, with the error as the reason
      }
    );
  },
  render: (h) => h(App)
}).$mount('#app');

// The following line is a hot patch to add regex support, theyre are better
// places to edit Prism variables, but could not locate them. Namely this is
// the Prism library variables, and not the Prism component variables
//@ts-ignore
Prism.languages['rb'] = {
  'token-name': {
    pattern: /(["'])(\1|(?:(?![^\\]\1)[\s\S])*[^\\]\1)/g
  }
};
