<template>
  <v-icon
    v-clipboard:copy="text"
    v-clipboard:success="onCopy"
    v-clipboard:error="onCopyFailure"
    small
    class="mr-2"
    type="button"
    >{{ icon }}</v-icon
  >
</template>

<script lang="ts">
import {SnackbarModule} from '@/store/snackbar';
import Vue from 'vue';
import Component from 'vue-class-component';
import VueClipboard from 'vue-clipboard2';
import {Prop} from 'vue-property-decorator';

VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);

@Component({})
export default class CopyButton extends Vue {
  @Prop({required: true}) readonly text!: string;
  @Prop({required: false, default: 'mdi-clipboard-outline'})
  readonly icon!: string;

  onCopy() {
    SnackbarModule.notify('Text copied to your clipboard');
  }

  onCopyFailure() {
    SnackbarModule.failure('Failed to copy to your clipboard');
  }
}
</script>
