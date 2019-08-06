<template>
  <h2>TreeMap and Others</h2>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const TreeMapProps = Vue.extend({
  props: {}
});

@Component({
  components: {}
})
export default class TreeMap extends TreeMapProps {}
</script>
