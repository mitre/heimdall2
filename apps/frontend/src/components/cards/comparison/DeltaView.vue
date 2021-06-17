<!-- Visualizes a delta between two controls -->
<template>
  <v-container fluid>
    <v-row v-if="head_changes" justify="center">
      <v-col cols="12">
        <span class="font-weight-black"> Metadata changes: </span>
      </v-col>
    </v-row>

    <ChangeItem
      v-for="change in headerChanges.changes"
      :key="change.name"
      :change="change"
    />
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import {
  ControlDelta,
  ControlChangeGroup,
  NOT_SELECTED
} from '@/utilities/delta_util';

import ChangeItem from '@/components/cards/comparison/ChangeItem.vue';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    ChangeItem
  }
})
export default class DeltaView extends Vue {
  @Prop({required: true}) readonly delta!: ControlDelta;

  get head_changes(): boolean {
    for (const change of this.headerChanges.changes) {
      for (const value of change.values) {
        if (value !== NOT_SELECTED) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Wrapped getters to utilize vue caching, and also just make things easier in the template.
   */
  get headerChanges(): ControlChangeGroup {
    return this.delta.headerChanges;
  }
}
</script>
