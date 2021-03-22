<template>
  <v-row class="pa-4" justify="space-between">
    <v-col data-cy="fileinfo" cols="12">
      <strong>Filename:</strong> {{ filename }}<br />
      <br />
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
import {InspecFile, ProfileFile} from '@/store/report_intake';

import {Prop} from 'vue-property-decorator';
import _ from 'lodash';
import TagRow from '@/components/global/tags/TagRow.vue';
import {profile_unique_key} from '@/utilities/format_util';
import {ContextualizedProfile} from 'inspecjs/dist/context';
import {InspecDataModule, isFromProfileFile} from '../../store/data_store';
import {context} from 'inspecjs';
import {IEvaluation} from '@heimdall/interfaces';
import {EvaluationModule} from '../../store/evaluations';

@Component({
  components: {
    TagRow
  }
})
export default class ProfileInfo extends Vue {
  @Prop({required: true}) readonly file!: ContextualizedProfile;

  //auto select the root prof
  mounted() {
    this.active = [profile_unique_key(this.file)];
    if (isFromProfileFile(this.selected!)) {
      this.from_file = this.selected.from_file as ProfileFile;
    }
  }

  from_file: InspecFile = {
    'unique_id': '',
    'filename': ''
  }
  active: string[] = [];


  /** Get the most recently selected */
  get selected(): context.ContextualizedProfile | undefined {
    return InspecDataModule.contextualProfiles.find(
      (p) => profile_unique_key(p) === this.active[0]
    );
  }


  get filename(): string | undefined {
    return (this.file as unknown as ProfileFile).filename
  }

  get duration(): string {
    return _.get(this.file, 'evaluation.data.statistics.duration') + '';
  }

  get evaluation(): IEvaluation | undefined {
    let result: IEvaluation | undefined;
    EvaluationModule.allEvaluations.forEach((e) => {
      if(e.id === (this.from_file.database_id?.toString())){
        result = e
      }
    })
    return result
  }
}
</script>
