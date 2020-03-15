<template>
  <div>
    <div>
      <span ref="a">Alpha</span>
      <span ref="b">Beta</span>
      <span ref="c">Gamma</span>
      <span ref="d">Delta</span>
    </div>

    <v-tooltip
      v-if="!!test_ref"
      :activator="test_ref"
      :attach="test_ref"
      :open-on-hover="false"
      v-model="test_model"
      content-class="test_class"
    >
      <span> {{ index }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});

@Component({
  components: {}
})
export default class SplunkReader extends Props {
  test_model = true;
  test_ref: Element | Vue | null = null;
  index = 0;
  shunt() {
    this.index = (this.index + 1) % 4;
    let refid = ["a", "b", "c", "d"][this.index];
    this.test_ref = this.$refs[refid] as Element;
    console.log(this.test_ref);
  }
}
</script>
