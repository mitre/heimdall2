<template>
  <v-app id="inspire">
    <!-- Router view. Typically a "subclass" of Base -->
    <router-view />

    <!-- Footer -->
    <v-spacer />
    <Footer />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Footer from '@/components/global/Footer.vue';

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
