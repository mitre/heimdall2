<template>
  <v-app id="inspire">
    <Spinner />
    <span
      v-if="classification"
      :style="classificationStyle"
      class="classification-footer"
    >
      {{ classification }}
    </span>
    <!-- Router view. Typically a "subclass" of Base -->
    <router-view :key="$route.fullPath" :class="classification ? 'pt-5' : ''" />
    <!-- Footer -->
    <v-spacer />
    <Footer />
    <Snackbar />
  </v-app>
</template>

<script lang="ts">
import Footer from '@/components/global/Footer.vue';
import Snackbar from '@/components/global/Snackbar.vue';
import Spinner from '@/components/global/Spinner.vue';
import Vue from 'vue';
import Component from 'vue-class-component';
import {ServerModule} from './store/server';

@Component({
  components: {
    Footer,
    Snackbar,
    Spinner
  }
})
export default class App extends Vue {
  get classificationStyle() {
    return {
      background: ServerModule.classificationBannerColor,
      color: `${ServerModule.classificationBannerTextColor} !important`
    };
  }

  get classification(): string {
    return ServerModule.classificationBannerText;
  }
}
</script>

<style scoped>
.classification-footer {
  z-index: 1000;
  position: fixed;
  text-align: center;
  left: 0;
  right: 0;
}
</style>
