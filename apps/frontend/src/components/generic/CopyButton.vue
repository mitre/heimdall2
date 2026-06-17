<template>
  <v-icon
    small
    class="mr-2"
    type="button"
    b-tooltip.hover
    :title="getTooltipTitle()"
    @click="copy"
  >
    {{ icon }}
  </v-icon>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { SnackbarModule } from '@/store/snackbar';

@Component({})
export default class CopyButton extends Vue {
  @Prop({ default: 'mdi-clipboard-outline', required: false })
  readonly icon!: string;

  @Prop({ required: true }) readonly text!: string;

  @Prop({ default: 'Copy content to clipboard', required: false, type: String })
  readonly tooltip!: string;

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
    } catch (error) {
      SnackbarModule.failure(`Failed to copy to your clipboard: ${error}`);
    }
  }

  getTooltipTitle() {
    return this.tooltip;
  }

  unsecuredCopyToClipboard(text: string) {
    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = text;

    // Set the style of the textarea to make it invisible
    tempTextArea.style.opacity = '0';
    tempTextArea.style.pointerEvents = 'none';
    tempTextArea.style.position = 'absolute';
    tempTextArea.style.left = '-9999px';

    document.body.append(tempTextArea);
    tempTextArea.focus();
    tempTextArea.select();
    const successfulReturn = document.execCommand('copy');
    if (!successfulReturn) {
      throw new Error(
        'The execCommand returned false, meaning the command is unsupported or disabled',
      );
    }
    tempTextArea.remove();
  }
}
</script>
