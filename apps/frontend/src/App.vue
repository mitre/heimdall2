<template>
  <v-app id="inspire">
    <!-- Top+Sidebar -->
    <Sidebar drawer="drawer" />
    <Topbar />

    <v-content>
      <Toolbar />
      <router-view></router-view>
    </v-content>

    <!-- Footer -->
    <v-btn bottom color="pink" dark fab fixed right @click="dialog = !dialog">
      <v-icon>add</v-icon>
    </v-btn>
    <Modal />
    <v-spacer />
    <v-footer
      app
      color="blue darken-3"
      dark
      title="footer"
      class="white--text font-weight-light"
    >
      <span>The MITRE Corporation &copy; 2019</span>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Sidebar from "@/components/Sidebar.vue";
import Topbar from "@/components/Topbar.vue";
import Toolbar from "@/components/Toolbar.vue";
import Modal from "@/components/Modal.vue";

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
    Modal
  }
})
export default class App extends AppProps {
  // State props
  dialog: boolean = false;
  drawer: boolean = false;

  created() {
    console.log(this);
    this.$vuetify.theme.dark = true;
  }
}
</script>
