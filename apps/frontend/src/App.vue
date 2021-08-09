<template>
  <v-app id="inspire">
    <!-- Router view. Typically a "subclass" of Base -->
    <router-view :key="$route.fullPath" />

    <!-- Footer -->
    <v-spacer />
    <ClassificationFooter />
    <Footer />
    <Snackbar />
  </v-app>
</template>

<script lang="ts">
import ClassificationFooter from '@/components/global/ClassificationFooter.vue';
import Footer from '@/components/global/Footer.vue';
import Snackbar from '@/components/global/Snackbar.vue';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {
    ClassificationFooter,
    Footer,
    Snackbar
  }
})
export default class App extends Vue {}
</script>
