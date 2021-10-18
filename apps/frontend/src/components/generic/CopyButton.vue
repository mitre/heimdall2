<template ref="container">
  <v-icon small class="mr-2" type="button" @click="copy">{{ icon }}</v-icon>
</template>

<script lang="ts">
import {SnackbarModule} from '@/store/snackbar';
import Vue from 'vue';
import Component from 'vue-class-component';
import VueClipboard from 'vue-clipboard2';
import {Prop} from 'vue-property-decorator';

Vue.use(VueClipboard);

@Component({})
export default class CopyButton extends Vue {
  @Prop({required: true}) readonly text!: string;
  @Prop({required: false, default: 'mdi-clipboard-outline'})
  readonly icon!: string;

  copy() {
    this.$copyText(
      this.text,
      document.querySelector('.v-dialog') as HTMLElement
    )
      .then(() => {
        SnackbarModule.notify('Text copied to your clipboard');
      })
      .catch(() => {
        SnackbarModule.failure('Failed to copy to your clipboard');
      });
  }
}
</script>
