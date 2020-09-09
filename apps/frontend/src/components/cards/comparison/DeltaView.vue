<!-- Visualizes a delta between two controls -->
<template>
  <v-container fluid>
    <!-- Header stuff -->
    <v-row v-if="head_changes" justify="center">
      <v-col cols="12">
        <span class="font-weight-black"> Metadata changes: </span>
      </v-col>
    </v-row>

    <ChangeItem
      v-for="change in header_changes.changes"
      :key="change.name"
      :change="change"
      :shift="shift"
    >
    </ChangeItem>
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
import TruncatedText from '@/components/generic/TruncatedText.vue';
import ControlRowCol from '@/components/cards/controltable/ControlRowCol.vue';

//TODO: add line numbers
import 'prismjs';
import 'prismjs/components/prism-makefile.js';
import 'prismjs/components/prism-ruby.js';
//@ts-ignore
import Prism from 'vue-prism-component';
Vue.component('prism', Prism);

import 'prismjs/components/prism-ruby.js';

// Define our props
const Props = Vue.extend({
  props: {
    delta: Object, // Of type ControlDelta
    shift: Number
  }
});

@Component({
  components: {
    ChangeItem,
    TruncatedText,
    Prism,
    ControlRowCol
  }
})
export default class DeltaView extends Props {
  /** Typed prop getter */
  get _delta(): ControlDelta {
    return this.delta as ControlDelta;
  }

  get head_changes(): boolean {
    for (let change of this.header_changes.changes) {
      for (let value of change.values) {
        if (value != NOT_SELECTED) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Wrapped getters to utilize vue caching, and also just make things easier in the template.
   */
  get header_changes(): ControlChangeGroup {
    return this._delta.header_changes;
  }
}
</script>
