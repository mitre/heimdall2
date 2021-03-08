<template>
  <v-icon
    v-clipboard:copy="shareItems(evaluation)"
    v-clipboard:success="onCopy"
    v-clipboard:error="onCopyFailure"
    small
    class="mr-2"
    type="button"
    >mdi-share</v-icon
  >
</template>

<script lang="ts">
import {IEvaluation} from '@heimdall/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {ServerModule} from '../../store/server';
import {SnackbarModule} from '../../store/snackbar';
import {Sample} from '../../utilities/sample_util';

@Component({})
export default class ShareEvaluationButton extends Vue {
  @Prop({required: true}) readonly evaluation!: IEvaluation;
  @Prop({required: true}) readonly selectedFiles!: IEvaluation[] | Sample[];

  onCopy() {
    SnackbarModule.notify('Successfully copied share link');
  }

  onCopyFailure() {
    SnackbarModule.failure('Failed to copy to your clipboard');
  }

  joinEvaluationsByIds(evaluations: IEvaluation[] | Sample[]): string {
    let stringresult = '';
    evaluations.forEach((evaluation: IEvaluation | Sample) => {
      if(evaluation.hasOwnProperty('id')){
        stringresult += `${(evaluation as IEvaluation).id},`;
      }
    });
    return stringresult.slice(0, -1);
  }

  shareItems(evaluation: IEvaluation): string {
    if (this.selectedFiles.length >= 1){
      const shareList = this.joinEvaluationsByIds(this.selectedFiles)
      return `${ServerModule.externalURL || window.location.origin}/results/${shareList}`;
    } else {
      return `${ServerModule.externalURL || window.location.origin}/results/${evaluation.id}`;
    }
  }
}
</script>
