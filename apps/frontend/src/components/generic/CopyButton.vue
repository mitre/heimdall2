<template>
  <v-icon
    v-clipboard:copy="text"
    v-clipboard:success="onCopy"
    v-clipboard:error="onCopyFailure"
    small
    class="mr-5"
    type="button"
    >mdi-clipboard-outline</v-icon
  >
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {SnackbarModule} from '@/store/snackbar';
import VueClipboard from 'vue-clipboard2';

VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);

@Component({})
export default class CopyButton extends Vue {
  @Prop({required: true}) readonly text!: string;

  onCopy() {
    SnackbarModule.notify('Text copied to your clipboard');
  }

  onCopyFailure() {
    SnackbarModule.failure('Failed to copy to your clipboard');
  }
}
</script>
