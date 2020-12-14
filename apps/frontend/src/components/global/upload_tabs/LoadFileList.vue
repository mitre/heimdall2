<template>
  <div>
    <v-container>
      <v-text-field
        v-model="search"
        class="px-3 pb-1 elevation-1"
        append-icon="mdi-magnify"
        label="Search"
        hide-details
      />
      <v-dialog v-model="deleteDialog" max-width="500px">
        <v-card>
          <v-card-title class="headline"
            >Are you sure you want to delete this item?</v-card-title
          >
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue darken-1" text @click="deleteDialog = false"
              >Cancel</v-btn
            >
            <v-btn color="blue darken-1" text @click="deleteItemConfirm(item)"
              >OK</v-btn
            >
            <v-spacer />
          </v-card-actions>
        </v-card>
      </v-dialog>
      <EditEvaluationModal
        :visible="editDialog"
        :active-item="activeItem"
        :active-index="activeIndex"
      />
      <v-data-table
        v-model="selectedFiles"
        dense
        :headers="headers"
        :items="files"
        :loading="loading"
        :item-key="fileKey"
        :search="search"
        show-select
        mobile-breakpoint="0"
        class="elevation-1"
      >
        <template #[`item.filename`]="{item}">
          <span
            id="sampleItem"
            class="cursor-pointer"
            @click="load_results([item])"
            >{{ item.filename }}</span
          >
        </template>
        <template #[`item.evaluationTags`]="{item}">
          <template v-for="tag in item.evaluationTags">
            <v-chip :key="tag.id + '_'" small>{{ tag.value }}</v-chip>
          </template>
        </template>
        <template #[`item.createdAt`]="{item}">
          <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
        </template>
        <template #[`item.actions`]="{item}">
          <v-icon small class="mr-2" @click="editItem(item)">
            mdi-pencil
          </v-icon>
          <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
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
import axios from 'axios';
import Vue from 'vue';
import Component from 'vue-class-component';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue'

import {SnackbarModule} from '@/store/snackbar';
import {IEvaluation} from '@heimdall/interfaces';
import {Prop} from 'vue-property-decorator';
import {Samples} from 'aws-sdk/clients/devicefarm';

@Component({
  components: {
    EditEvaluationModal
  }
})
export default class LoadFileList extends Vue {
  @Prop({required: true}) readonly headers!: Object[];
  @Prop({type: Boolean, default: false}) readonly loading!: boolean;
  @Prop({type: String, default: 'id'}) readonly fileKey!: string;
  @Prop({required: true}) readonly files!: IEvaluation[] | Samples[];

  selectedFiles: IEvaluation[] | Samples[] = [];
  activeIndex: number = -1;
  activeItem: any = {};

  editDialog: boolean = false;
  deleteDialog: boolean = false;
  search: string = '';

  load_results(evaluations: IEvaluation[]) {
    this.selectedFiles = [];
    this.$emit('load-results', evaluations);
  }

  editItem (item: IEvaluation) {
    this.activeItem = item
    this.activeIndex = this.files.indexOf(this.activeItem)
    this.editDialog = true;
  }

  deleteItem(item: IEvaluation) {
    this.activeItem = item
    this.activeIndex = this.files.indexOf(this.activeItem)
    this.deleteDialog = true;
  }

  async deleteItemConfirm(): Promise<void>{
    axios.delete(`/evaluations/${this.activeIndex}`).then((data) => {
      SnackbarModule.notify('Evaluation deleted successfully.')
      this.files.splice(this.activeIndex, 1)
    }).catch((error) => {
      SnackbarModule.notify(error.response.data.message);
        if (typeof error.response.data.message === 'object') {
          SnackbarModule.notify(
            error.response.data.message
              .map(function capitalize(c: string) {
                return c.charAt(0).toUpperCase() + c.slice(1);
              })
            .join(', ')
          );
        }
      else {
        SnackbarModule.notify(error.response.data.message);
      }
    });
    this.deleteDialog = false;
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
