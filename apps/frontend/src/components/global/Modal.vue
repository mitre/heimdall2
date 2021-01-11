<template>
  <v-dialog
    id="modal"
    :value="visible"
    :persistent="persistent"
    :width="width"
    max-width="1900px"
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
  @Prop({default: false}) readonly persistent!: boolean;
  @Prop({default: "80%"}) readonly width!: string;
}
</script>
