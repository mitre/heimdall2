<template>
  <v-icon
    v-clipboard:copy="shareItems(evaluation)"
    v-clipboard:success="onCopy"
    v-clipboard:error="onCopyFailure"
    small
    class="mr-5"
    type="button"
    >mdi-share-variant</v-icon
  >
</template>

<script lang="ts">
import {IEvaluation} from '@heimdall/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {SnackbarModule} from '@/store/snackbar';
import VueClipboard from 'vue-clipboard2';

VueClipboard.config.autoSetContainer = true;

Vue.use(VueClipboard);

@Component({})
export default class ShareEvaluationButton extends Vue {
  @Prop({required: true}) readonly evaluation!: IEvaluation;

  onCopy() {
    SnackbarModule.notify('Link copied to clipboard');
  }

  onCopyFailure() {
    SnackbarModule.failure('Failed to copy to your clipboard');
  }

  shareItems(evaluation: IEvaluation): string {
    return `${window.location.origin}/results/${evaluation.id}`;
  }
}
</script>
