<!-- Visualizes a delta between two controls -->
<template>
  <v-row>
    <v-col cols="3" xs="3" sm="2" md="1" class="pa-0">
      <slot name="name" />
    </v-col>
    <v-col
      v-for="(value, i) in values"
      :key="i"
      class="px-2"
      cols="4"
      xs="4"
      md="5"
    >
      <v-card v-if="value != 'not selected'" class="pa-2" :color="color(value)">
        {{ value }}
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import {ControlChange} from '@/utilities/delta_util';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {}
})
export default class ChangeItem extends Vue {
  @Prop({type: Object, required: true}) readonly change!: ControlChange;

  color(status: string): string {
    if (this.change.name.toLowerCase() == 'status') {
      return `status${status.replace(' ', '')}`;
    }
    return '';
  }

  get values(): string[] {
    return this.change.values;
  }
}
</script>
