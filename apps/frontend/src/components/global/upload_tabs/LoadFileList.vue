<template>
  <div>
    <div class="ma-0 pa-0">
      <v-text-field
        v-model="search"
        class="px-3 pb-1"
        append-icon="mdi-magnify"
        label="Search"
        hide-details
      />
      <DeleteDialog
        v-model="deleteItemDialog"
        type="file"
        @cancel="deleteItemDialog = false"
        @confirm="deleteItemConfirm"
      />
      <div class="d-flex flex-column">
        <v-data-table
          v-model="selectedFiles"
          data-cy="loadFileList"
          dense
          :headers="headers"
          :items="filteredFiles"
          :loading="loading"
          :sort-by.sync="sortBy"
          :sort-desc="sortDesc"
          :item-key="fileKey"
          show-select
          mobile-breakpoint="0"
        >
          <template #[`item.filename`]="{item}">
            <span class="cursor-pointer" @click="load_results([item])">{{
              item.filename
            }}</span>
          </template>
          <template #[`item.evaluationTags`]="{item}">
            <TagRow :evaluation="item" />
          </template>
          <template #[`item.createdAt`]="{item}">
            <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
          </template>
          <template #[`item.actions`]="{item}">
            <v-row class="d-flex flex-row-reverse">
              <ShareEvaluationButton title="Share Result" :evaluation="item" />
              <div v-if="item.editable">
                <EditEvaluationModal
                  id="editEvaluationModal"
                  :active="item"
                  @updateEvaluations="updateEvaluations"
                >
                  <template #clickable="{on}"
                    ><v-icon
                      data-cy="edit"
                      small
                      title="Edit"
                      class="mr-2"
                      v-on="on"
                    >
                      mdi-pencil
                    </v-icon>
                  </template>
                </EditEvaluationModal>
                <v-icon
                  data-cy="delete"
                  class="mr-2"
                  small
                  @click="deleteItem(item)"
                  >mdi-delete</v-icon
                >
              </div>
            </v-row>
          </template>
        </v-data-table>
        <v-btn
          block
          class="card-outter"
          :disabled="loading"
          @click="load_results(selectedFiles)"
        >
          Load Selected
          <v-icon class="pl-2"> mdi-file-download</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue';
import ShareEvaluationButton from '@/components/generic/ShareEvaluationButton.vue'
import TagRow from '@/components/global/tags/TagRow.vue';
import {SnackbarModule} from '@/store/snackbar';
import {EvaluationModule} from '@/store/evaluations'
import {IEvaluation, IEvaluationTag} from '@heimdall/interfaces';
import {Prop} from 'vue-property-decorator';
import {Sample} from '@/utilities/sample_util';
import DeleteDialog from '@/components/generic/DeleteDialog.vue';

@Component({
  components: {
    DeleteDialog,
    EditEvaluationModal,
    ShareEvaluationButton,
    TagRow
  }
})
export default class LoadFileList extends Vue {
  @Prop({required: true}) readonly headers!: Object[];
  @Prop({type: Boolean, default: false}) readonly loading!: boolean;
  @Prop({type: String, default: 'id'}) readonly fileKey!: string;
  @Prop({type: String, default: 'createdAt'}) readonly sortBy!: string;
  @Prop({type: Boolean, default: true}) readonly sortDesc!: boolean;
  @Prop({required: true}) readonly files!: IEvaluation[] | Sample[];

  selectedFiles: IEvaluation[] | Sample[] = [];
  activeItem!: IEvaluation;
  activeTag!: IEvaluationTag;

  deleteItemDialog = false;
  deleteTagDialog = false;
  search = '';

  load_results(evaluations: IEvaluation[]) {
    this.selectedFiles = [];
    this.$emit('load-results', evaluations);
  }

  updateEvaluations() {
    EvaluationModule.getAllEvaluations();
  }

  editItem(item: IEvaluation) {
    this.activeItem = item;
  }

  deleteItem(item: IEvaluation) {
    this.activeItem = item;
    this.deleteItemDialog = true;
  }

  deleteTag(tag: IEvaluationTag) {
    this.activeTag = tag;
    this.deleteTagDialog = true;
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
    })
    this.deleteItemDialog = false;
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
.card-outter {
  position: absolute;
  bottom: 0;
}
</style>
