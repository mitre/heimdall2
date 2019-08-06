<template>
  <v-app id="inspire">
    <!-- Top+Sidebar -->
    <Sidebar drawer="drawer" />
    <Topbar />

    <v-content>
      <!-- toolbar -->
      <v-sheet>
        <v-toolbar dense ma-4 pa-4>
          <v-toolbar-title>Title</v-toolbar-title>

          <v-spacer></v-spacer>

          <v-toolbar-items>
            <v-btn text>Link 1</v-btn>
            <v-btn text>Link 2</v-btn>
            <v-btn text>Link 3</v-btn>
          </v-toolbar-items>

          <template v-if="$vuetify.breakpoint.smAndUp">
            <v-btn icon>
              <v-icon>mdi-export-variant</v-icon>
            </v-btn>
            <v-btn icon>
              <v-icon>mdi-delete-circle</v-icon>
            </v-btn>
            <v-btn icon>
              <v-icon>mdi-plus-circle</v-icon>
            </v-btn>
          </template>
        </v-toolbar>
      </v-sheet>
      <!-- end toolbar -->
      <!-- core content -->
      <router-view></router-view>
      <!-- end core content -->
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
