<template>
  <v-footer app title="footer" class="font-weight-light" color="background">
    <span>The MITRE Corporation &copy; 2019</span>
  </v-footer>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const FooterProps = Vue.extend({
  props: {}
});

@Component({
  components: {}
})
export default class Footer extends FooterProps {}
</script>
