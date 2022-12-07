<template>
  <v-footer app title="footer" class="bar font-weight-light ml-10">
    <span class="bar-visible--text">
      The MITRE Corporation &copy; 2018-{{ new Date().getFullYear() }}
    </span>
    <v-spacer />
    <v-btn
      href="https://github.com/mitre/heimdall2"
      target="_blank"
      class="text-decoration-none pr-4"
      text
      medium
    >
      <v-icon medium color="white">mdi-github</v-icon>
    </v-btn>
    <v-btn href="https://www.netlify.com" target="_blank" text medium>
      <img
        :src="require('@/assets/netlify-light.svg')"
        style="width: 1.5rem; height: 1.5rem; vertical-align: middle"
        alt="Netlify.com"
      />
    </v-btn>
    <v-btn
      :href="repository + changelog"
      target="_blank"
      class="pl-4"
      text
      medium
      no-padding
    >
      <v-icon medium>mdi-alpha-v-circle</v-icon>
      <span class="d-sm-inline text-center pl-1 text-decoration-none">{{
        version
      }}</span>
    </v-btn>
  </v-footer>
</template>

<script lang="ts">
import Component, {mixins} from 'vue-class-component';
import AppInfoMixin from '@/mixins/AppInfoMixin';

@Component({})
export default class Footer extends mixins(AppInfoMixin) {}
</script>
