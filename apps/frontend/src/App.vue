<template>
  <v-app id="inspire">
    <!-- Router view. Typically a "subclass" of Base -->
    <router-view :key="$route.fullPath" />

    <!-- Footer -->
    <v-spacer />
    <Footer />
    <Snackbar />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Footer from '@/components/global/Footer.vue';
import Snackbar from '@/components/global/Snackbar.vue';
import {ServerModule} from '@/store/server';

@Component({
  components: {
    Footer,
    Snackbar
  }
})
export default class App extends Vue {
  checkForUpdates() {
    ServerModule.checkForUpdate();
  }
  mounted() {
    this.checkForUpdates();
  }
}
</script>
