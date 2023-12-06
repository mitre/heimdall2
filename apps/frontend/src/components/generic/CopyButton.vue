<template>
  <v-icon small class="mr-2" type="button" @click="copy">{{ icon }}</v-icon>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {SnackbarModule} from '@/store/snackbar';

@Component({})
export default class CopyButton extends Vue {
  @Prop({required: true}) readonly text!: string;
  @Prop({required: false, default: 'mdi-clipboard-outline'})
  readonly icon!: string;

  async copy() {
    try {
      if (navigator.clipboard) {
        // If https, use the new API secure copy
        await navigator.clipboard.writeText(this.text);
      } else {
        // Otherwise fallback to the old API
        this.unsecuredCopyToClipboard(this.text);
      }
      SnackbarModule.notify('Text copied to your clipboard');
    } catch (e) {
      SnackbarModule.failure(`Failed to copy to your clipboard: ${e}`);
    }
  }

  unsecuredCopyToClipboard(text: string) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = text;

    // Set the style of the textarea to make it invisible
    tempTextArea.style.opacity = '0';
    tempTextArea.style.pointerEvents = 'none';
    tempTextArea.style.position = 'absolute';
    tempTextArea.style.left = '-9999px';

    document.body.appendChild(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextArea);
  }
}
</script>
