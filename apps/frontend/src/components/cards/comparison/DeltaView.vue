<!-- Visualizes a delta between two controls -->
<template>
  <v-card>
    <v-container fluid>
      <!-- Title row -->
      <ChangeItem class="background lighten-2">
        <template #old>
          {{ old_name }}
        </template>
        <template #new>
          {{ new_name }}
        </template>
      </ChangeItem>

      <!-- Header stuff -->
      <v-row v-if="header_changes.any" justify="center">
        <v-col cols="12">
          <span class="font-weight-black"> Header changes: </span>
        </v-col>
      </v-row>

      <ChangeItem v-for="change in header_changes.changes" :key="change.name">
        <template #name>
          {{ change.name }}
        </template>
        <template #old>
          {{ change.old }}
        </template>
        <template #new>
          {{ change.new }}
        </template>
      </ChangeItem>

      <!-- Code stuff -->
      <v-row v-if="code_changes.any" justify="center">
        <v-col cols="12">
          <span class="font-weight-black"> Code changes: </span>
        </v-col>
      </v-row>

      <ChangeItem v-for="change in code_changes.changes" :key="change.name">
        <template #name>
          {{ change.name }}
        </template>
        <template #old>
          {{ change.old }}
        </template>
        <template #new>
          {{ change.new }}
        </template>
      </ChangeItem>

      <!-- Result stuff -->
      <v-row v-if="result_changes.length > 0" justify="center">
        <v-col cols="12">
          <span class="font-weight-black"> Result changes: </span>
        </v-col>
      </v-row>

      <!-- A title per changed segment. We truncate these -->
      <template v-for="change_group in result_changes">
        <v-row justify="center" :key="change_group.name">
          <v-col cols="12">
            <TruncatedText
              :span_classes="['font-weight-bold']"
              :text="change_group.name"
            />
          </v-col>
        </v-row>

        <ChangeItem
          v-for="change in change_group.changes"
          :key="change_group.name + change.name"
        >
          <template #name>
            {{ change.name }}
          </template>
          <template #old>
            {{ change.old }}
          </template>
          <template #new>
            {{ change.new }}
          </template>
        </ChangeItem>
      </template>
    </v-container>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { ContextualizedControl } from "@/store/data_store";
import { HDFControl, HDFControlSegment, SegmentStatus } from "inspecjs";
import { ControlDelta, ControlChangeGroup } from "@/utilities/delta_util";
import { diffArrays, ArrayOptions } from "diff";
import ChangeItem from "@/components/cards/comparison/ChangeItem.vue";
import TruncatedText from "@/components/generic/TruncatedText.vue";

// Define our props
const Props = Vue.extend({
  props: {
    delta: Object // Of type ControlDelta
  }
});

@Component({
  components: {
    ChangeItem,
    TruncatedText
  }
})
export default class DeltaView extends Props {
  /** Typed prop getter */
  get _delta(): ControlDelta {
    return this.delta as ControlDelta;
  }

  /** Formatted name for our older control */
  get old_name(): string {
    return this._delta.old.root.hdf.start_time || "Old";
  }

  /** Formatted name for our newer control */
  get new_name(): string {
    return this._delta.new.root.hdf.start_time || "New";
  }

  /**
   * Wrapped getters to utilize vue caching, and also just make things easier in the template.
   */
  get header_changes(): ControlChangeGroup {
    return this._delta.header_changes;
  }

  get code_changes(): ControlChangeGroup | undefined {
    return this._delta.code_changes;
  }

  get result_changes(): ControlChangeGroup[] | undefined {
    return this._delta.segment_changes;
  }
}
</script>
