<template>
  <div>
    <v-chip-group
      :items="groups"
      :hide-details="true"
      hide-selected
      multiple
      chips
    >
      <template v-for="(group, i) in groups">
        <v-chip :key="'chip' + i" small>{{ group.text }}</v-chip>
      </template>
    </v-chip-group>
  </div>
</template>

<script lang="ts">
import {IEvaluation} from '@heimdall/interfaces';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import EvaluationMixin from '../../../mixins/EvaluationMixin';

@Component({})
export default class GroupRow extends mixins(EvaluationMixin) {
  @Prop({required: true}) readonly evaluation!: IEvaluation;

  get groups() {
    return this.convertGroupsToIVuetifyItems(this.evaluation.groups);
  }
}
</script>
