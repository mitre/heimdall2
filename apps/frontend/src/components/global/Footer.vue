<template>
  <v-footer app title="footer" class="bar font-weight-light">
    <span class="bar-visible--text">
      The MITRE Corporation &copy; 2018-{{ new Date().getFullYear() }}
    </span>
    <v-spacer />
    <a href="https://www.netlify.com">
      <img
        :src="require('@/assets/netlify-light.svg')"
        style="width: 1.5rem; height: 1.5rem; vertical-align: middle"
        class="mr-4"
      />
    </a>
    <a href="https://github.com/mitre/heimdall2" style="text-decoration: none">
      <v-icon medium color="white">mdi-github</v-icon>
    </a>
  </v-footer>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({})
export default class Footer extends Vue {}
</script>
