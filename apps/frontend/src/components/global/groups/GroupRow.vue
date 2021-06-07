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
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import DeleteDialog from '@/components/generic/DeleteDialog.vue';
import {IVuetifyItems} from '../../../utilities/helper_util';

@Component({
  components: {
    DeleteDialog
  }
})
export default class GroupRow extends Vue {
  @Prop({required: true}) readonly groups!: IVuetifyItems;
}
</script>
