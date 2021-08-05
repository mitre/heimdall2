<template>
  <div>
    <v-chip-group
      :items="groups"
      :hide-details="true"
      hide-selected
      multiple
      chips
    >
      <v-chip v-for="(group, i) in groups" :key="'chip' + i" small>{{
        group.text
      }}</v-chip>
    </v-chip-group>
  </div>
</template>

<script lang="ts">
import DeleteDialog from '@/components/generic/DeleteDialog.vue';
import {IEvaluation} from '@heimdall/interfaces';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import EvaluationMixin from '../../../mixins/EvaluationMixin';

@Component({
  components: {
    DeleteDialog
  }
})
export default class GroupRow extends mixins(EvaluationMixin) {
  @Prop({required: true}) readonly evaluation!: IEvaluation;

  get groups() {
    return this.convertGroupsToIVuetifyItems(this.evaluation.groups);
  }
}
</script>
