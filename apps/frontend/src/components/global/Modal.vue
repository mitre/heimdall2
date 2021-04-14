<template>
  <v-dialog
    id="modal"
    :value="visible"
    :persistent="persistent"
    :max-width="fullscreen ? '100%' : maxWidth"
    content-class="v-card"
    @click:outside="$emit('close-modal')"
    @keydown.esc="$emit('close-modal')"
  >
    <slot> Default Modal </slot>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {}
})
export default class Modal extends Vue {
  @Prop({default: true}) readonly visible!: boolean;
  @Prop({default: false}) readonly fullscreen!: boolean;
  @Prop({default: false}) readonly persistent!: boolean;
  @Prop({default: "1200px"}) readonly maxWidth!: string;
}
</script>

<style lang="scss">
.v-dialog {
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}
</style>
