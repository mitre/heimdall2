<template>
  <div>
    <v-container class="ma-0 pa-0">
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
            >Are you sure you want to delete this file?</v-card-title
          >
          <v-card-actions>
            <v-spacer />
            <v-btn color="blue darken-1" text @click="deleteDialog = false"
              >Cancel</v-btn
            >
            <v-btn color="blue darken-1" text @click="deleteItemConfirm()"
              >OK</v-btn
            >
            <v-spacer />
          </v-card-actions>
        </v-card>
      </v-dialog>
      <EditEvaluationModal
        v-if="editDialog"
        :visible="editDialog"
        :active="activeItem"
        @updateEvaluations="updateEvaluations"
        @closeEditModal="closeEditModal"
      />
      <v-data-table
        v-model="selectedFiles"
        dense
        :headers="headers"
        :items="filteredFiles"
        :loading="loading"
        :sort-by.sync="sortBy"
        :item-key="fileKey"
        show-select
        mobile-breakpoint="0"
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
          <TagRow :evaluation="item" />
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
import Vue from 'vue';
import Component from 'vue-class-component';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue';
import TagRow from '@/components/global/tags/TagRow.vue';
import {SnackbarModule} from '@/store/snackbar';
import {EvaluationModule} from '@/store/evaluations'
import {IEvaluation} from '@heimdall/interfaces';
import {Prop} from 'vue-property-decorator';
import {Sample} from '@/utilities/sample_util';

@Component({
  components: {
    EditEvaluationModal,
    TagRow
  }
})
export default class LoadFileList extends Vue {
  @Prop({required: true}) readonly headers!: Object[];
  @Prop({type: Boolean, default: false}) readonly loading!: boolean;
  @Prop({type: String, default: 'id'}) readonly fileKey!: string;
  @Prop({type: String, default: 'filename'}) readonly sortBy!: string;
  @Prop({required: true}) readonly files!: IEvaluation[] | Sample[];

  selectedFiles: IEvaluation[] | Sample[] = [];
  activeItem!: IEvaluation;

  editDialog: boolean = false;
  deleteDialog: boolean = false;
  search: string = '';

  load_results(evaluations: IEvaluation[]) {
    this.selectedFiles = [];
    this.$emit('load-results', evaluations);
  }

  closeEditModal() {
    this.editDialog = false;
  }

  updateEvaluations() {
    EvaluationModule.getAllEvaluations();
  }

  editItem(item: IEvaluation) {
    this.activeItem = item;
    this.editDialog = true;
  }

  deleteItem(item: IEvaluation) {
    this.activeItem = item;
    this.deleteDialog = true;
  }

 filterEvaluationTags(file: IEvaluation | Sample, search: string) {
    let result = false;
    if('evaluationTags' in file)
    {
      file.evaluationTags?.forEach((tag) => {
        if (tag.value.toLowerCase().includes(search)) {
          result = true;
        };
      })
    }
    return result
  }

  async deleteItemConfirm(): Promise<void>{
    EvaluationModule.deleteEvaluation(this.activeItem).then(() => {
      SnackbarModule.notify("Deleted evaluation successfully.")
    }).catch((error) => {
      SnackbarModule.HTTPFailure(error)
    });
    this.deleteDialog = false;
  }

  get filteredFiles() {
    let matches: Array<IEvaluation | Sample> = []
    if (this.search != '') {
      let searchToLower = this.search.toLowerCase();
      (this.files as Array<IEvaluation | Sample>).forEach(async (item: IEvaluation | Sample) => {
          if (this.filterEvaluationTags(item, searchToLower) || item.filename.toLowerCase().includes(searchToLower)) {
          matches.push(item)
        }
      })
    } else {
      return this.files;
    }
    return matches
  }
}
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>
