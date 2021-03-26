<template>
  <v-row class="pa-4" justify="space-between">
    <v-col data-cy="fileinfo" cols="12">
      <strong>Filename:</strong> {{ file.filename }}<br />
      <strong>Tool Version:</strong> {{ inspec_version }}<br />
      <strong>Platform:</strong> {{ platform }}<br />
      <strong v-if="duration">Duration:</strong> {{ duration }}<br />
      <div v-if="evaluation" class="d-flex flex-nowrap">
        <strong class="pt-1 pr-1">Tags:</strong>
        <TagRow :evaluation="evaluation" />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';

import {Prop} from 'vue-property-decorator';
import _ from 'lodash';
import {EvaluationModule} from '../../store/evaluations';
import TagRow from '@/components/global/tags/TagRow.vue'
import {IEvaluation} from '@heimdall/interfaces';

@Component({
  components: {
    TagRow
  }
})
export default class EvaluationInfo extends Vue {
  @Prop({required: true}) readonly file!: EvaluationFile | ProfileFile;

  get filename(): string {
    return this.file.filename;
  }

  get inspec_version(): string | undefined {
    if(this.file.hasOwnProperty('evaluation')){
      return _.get(this.file, 'evaluation.data.version');
    }
  }

  get platform(): string | undefined {
    if(this.file.hasOwnProperty('evaluation')){
      return _.get(this.file, 'evaluation.data.platform.name') + _.get(this.file, 'evaluation.data.platform.release');
    }
  }

  get duration(): string {
    return _.get(this.file, 'evaluation.data.statistics.duration') + '';
  }

  get evaluation(): IEvaluation | undefined {
    let result: IEvaluation | undefined;
    EvaluationModule.allEvaluations.forEach((e) => {
      if(e.id === this.file.database_id?.toString()) {
        result = e
      }
    })
    return result
  }
}
</script>
