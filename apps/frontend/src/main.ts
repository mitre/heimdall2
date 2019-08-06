import Vue from "vue";
import App from "@/App.vue";
import router from "@/router";
import store from "@/store/store";
import vuetify from "@/plugins/vuetify"; // path to vuetify export
import "roboto-fontface/css/roboto/roboto-fontface.css";
//import "@mdi/font/css/materialdesignicons.css";
import "material-design-icons-iconfont/dist/material-design-icons.css";

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
