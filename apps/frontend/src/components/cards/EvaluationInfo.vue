<template>
  <v-row class="pa-4" dense justify="space-between">
    <v-col data-cy="fileinfo" cols="11">
      <strong>Filename:</strong> {{ filename }}<br />
      <div v-if="inspec_version">
        <strong>Tool Version:</strong> {{ inspec_version }}
      </div>
      <div v-if="platform"><strong>Platform:</strong> {{ platform }}</div>
      <div v-if="duration">
        <strong>Duration:</strong> {{ duration }} Seconds
      </div>
      <div v-if="startTime"><strong>Start Time:</strong> {{ startTime }}</div>
      <div v-if="evaluation" class="d-flex flex-nowrap">
        <strong class="pt-2 pr-1">Tags:</strong>
        <TagRow v-if="evaluation.id" :evaluation="evaluation" />
      </div>
      <div
        v-if="evaluation && evaluation.groups.length !== 0"
        class="d-flex flex-nowrap"
      >
        <strong class="pt-2 pr-1">Groups:</strong>
        <GroupRow :evaluation="evaluation" />
      </div>
    </v-col>
    <v-col cols="1">
      <div
        v-if="file.from_file.database_id && evaluation && evaluation.editable"
        class="top-right"
      >
        <v-icon
          data-cy="edit"
          title="Edit"
          class="mr-3 mt-3"
          @click="showEditEvaluationModal = true"
        >
          mdi-pencil
        </v-icon>
        <EditEvaluationModal
          v-if="evaluation && showEditEvaluationModal"
          id="editEvaluationModal"
          :visible="showEditEvaluationModal"
          :active="evaluation"
          @close="showEditEvaluationModal = false"
        />
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import GroupRow from '@/components/global/groups/GroupRow.vue';
import TagRow from '@/components/global/tags/TagRow.vue';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue';
import {
  EvaluationFile,
  ProfileFile,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import {IEvaluation} from '@heimdall/interfaces';
import {ContextualizedEvaluation} from 'inspecjs';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {EvaluationModule} from '../../store/evaluations';
import {get_eval_start_time} from '../../utilities/delta_util';

@Component({
  components: {
    EditEvaluationModal,
    GroupRow,
    TagRow
  }
})
export default class EvaluationInfo extends Vue {
  @Prop({required: true}) readonly file!:
    | SourcedContextualizedEvaluation
    | SourcedContextualizedProfile;

  showEditEvaluationModal = false;

  get file_object(): EvaluationFile | ProfileFile {
    return this.file.from_file;
  }

  get filename(): string {
    // Filename can be updated by a user when filename is loaded from the database. This causes any changes
    // to the name to show up right away.
    return this.evaluation?.filename || this.file_object.filename;
  }

  get inspec_version(): string | undefined {
    return _.get(this.file_object, 'evaluation.data.version');
  }

  get platform(): string | undefined {
    return `${_.get(this.file_object, 'evaluation.data.platform.name')}${_.get(
      this.file_object,
      'evaluation.data.platform.release'
    )}`;
  }

  get duration(): string | undefined {
    const duration = _.get(this.file_object, 'evaluation.data.statistics.duration');
    return duration === null || duration == undefined ? undefined : duration.toString();
  }

  get evaluation(): IEvaluation | undefined {
    return EvaluationModule.evaluationForFile(this.file_object);
  }

  get startTime(): string | null {
    return get_eval_start_time(this.file as ContextualizedEvaluation);
  }
}
</script>
<style scoped>
.top-right {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
