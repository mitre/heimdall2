<template>
  <v-app id="inspire">
    <!-- Top+Sidebar -->
    <Sidebar :drawer="drawer" />
    <Topbar v-on:toggle-drawer="drawer = !drawer" />

    <v-content>
      <Toolbar />
      <router-view></router-view>
    </v-content>

    <v-btn
      bottom
      color="teal"
      dark
      fab
      fixed
      right
      @click="dialog = !dialog"
      :hidden="dialog"
    >
      <v-icon>add</v-icon>
    </v-btn>

    <Modal :dialog="dialog" v-on:modal-dismissed="dialog = false" />

    <v-spacer />
    <Footer />
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Sidebar from "@/components/global/Sidebar.vue";
import Topbar from "@/components/global/Topbar.vue";
import Toolbar from "@/components/global/Toolbar.vue";
import Modal from "@/components/global/Modal.vue";
import Footer from "@/components/global/Footer.vue";

// We declare the props separately
// to make props types inferable.
const AppProps = Vue.extend({
  props: {
    source: String
  }
});

@Component({
  components: {
    Sidebar,
    Topbar,
    Toolbar,
    Footer,
    Modal
  }
})
export default class App extends AppProps {
  drawer: boolean = false;
  dialog: boolean = false;
}
</script>
