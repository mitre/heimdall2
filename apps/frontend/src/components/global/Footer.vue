<template>
  <v-footer app title="footer" class="bar font-weight-light">
    <span class="bar-visible--text">
      The MITRE Corporation &copy; 2018-{{ new Date().getFullYear() }}
    </span>
  </v-footer>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

// We declare the props separately to make props types inferable.
const FooterProps = Vue.extend({
  props: {}
});

@Component({
  components: {}
})
export default class Footer extends FooterProps {}
</script>
