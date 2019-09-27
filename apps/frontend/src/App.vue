<template>
  <v-app id="inspire" style="background: var(--v-background-base)">
    <!-- Router view. Typically a "subclass" of Base -->
    <router-view></router-view>

    <!-- Footer -->
    <v-spacer />
    <Footer />
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Footer from "@/components/global/Footer.vue";

// We declare the props separately
// to make props types inferable.
const AppProps = Vue.extend({});

@Component({
  components: {
    Footer
  }
})
export default class App extends AppProps {}
</script>

<!-- Style to fix dark mode to use our color scheme -->
<style>
.theme--light.v-card,
.theme--light.v-sheet,
.theme--light.v-navigation-drawer {
  background: var(--v-background-lighten-1);
}
</style>
