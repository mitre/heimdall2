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
      navigator.clipboard.writeText(this.text);
      SnackbarModule.notify('Text copied to your clipboard');
    } catch (e) {
      SnackbarModule.failure(`Failed to copy to your clipboard: ${e}`);
    }
  }
}
</script>
