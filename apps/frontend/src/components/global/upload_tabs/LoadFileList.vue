<template>
  <div>
    <v-container>
      <v-data-table
        v-model="selectedFiles"
        dense
        :headers="headers"
        :items="files"
        :loading="loading"
        :item-key="fileKey"
        show-select
        mobile-breakpoint="0"
        class="elevation-1"
      >
        <template v-slot:[`item.filename`]="{item}">
          <span class="cursor-pointer" @click="load_results([item])">{{
            item.filename
          }}</span>
        </template>
        <template v-slot:[`item.createdAt`]="{item}">
          <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
        </template>
      </v-data-table>
    </v-container>
    <v-btn block class="px-2" @click="load_results(selectedFiles)">
      Load Selected
      <v-icon class="pl-2"> mdi-file-download</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

import {IEvaluation} from '@heimdall/interfaces';
import {Prop} from 'vue-property-decorator';
import {Samples} from 'aws-sdk/clients/devicefarm';

@Component({
  components: {}
})
export default class LoadFileList extends Vue {
  @Prop({required: true}) readonly headers!: Object[];
  @Prop({default: false}) readonly loading!: boolean;
  @Prop({default: 'id'}) readonly fileKey!: string;
  @Prop({default: false}) readonly files!: IEvaluation[] | Samples[];
  selectedFiles: IEvaluation[] | Samples[] = [];

  load_results(evaluations: IEvaluation[]) {
    this.$emit('load_results', evaluations);
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
