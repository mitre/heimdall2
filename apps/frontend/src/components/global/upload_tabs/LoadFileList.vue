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
      <ActionDialog
        v-model="deleteItemDialog"
        type="file"
        @cancel="deleteItemDialog = false"
        @confirm="deleteItemConfirm"
      />
      <div class="d-flex flex-column">
        <v-data-table
          v-model="selectedFiles"
          data-cy="loadFileList"
          class="pb-8"
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
            <span class="cursor-pointer" @click="emit_selected([item])">{{
              item.filename
            }}</span>
          </template>
          <template #[`item.groups`]="{item}">
            <GroupRow v-if="item.id" :evaluation="item" />
          </template>
          <template #[`item.evaluationTags`]="{item}">
            <TagRow v-if="item.id" :evaluation="item" />
          </template>
          <template #[`item.createdAt`]="{item}">
            <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
          </template>
          <template #[`item.actions`]="{item}">
            <v-row class="d-flex flex-row-reverse">
              <EditEvaluationModal
                v-if="editEvaluationDialog"
                id="editEvaluationModal"
                :active="activeItem"
                :visible="editEvaluationDialog && activeItem.id === item.id"
                @updateEvaluations="updateEvaluations"
                @close="editEvaluationDialog = false"
              />
              <CopyButton
                :text="createShareLink(item)"
                icon="mdi-share-variant"
              />
              <div v-if="item.editable">
                <v-icon
                  data-cy="edit"
                  small
                  title="Edit"
                  class="mr-2"
                  @click="editItem(item)"
                >
                  mdi-pencil
                </v-icon>
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
          @click="emit_selected(selectedFiles)"
        >
          Load Selected
          <v-icon class="pl-2"> mdi-file-download</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ActionDialog from '@/components/generic/ActionDialog.vue';
import CopyButton from '@/components/generic/CopyButton.vue';
import GroupRow from '@/components/global/groups/GroupRow.vue';
import TagRow from '@/components/global/tags/TagRow.vue';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue';
import {EvaluationModule} from '@/store/evaluations';
import {SnackbarModule} from '@/store/snackbar';
import {Sample} from '@/utilities/sample_util';
import {IEvaluation, IEvaluationTag} from '@heimdall/common/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    ActionDialog,
    EditEvaluationModal,
    CopyButton,
    GroupRow,
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

  editEvaluationDialog = false;
  deleteItemDialog = false;
  deleteTagDialog = false;
  search = '';

  emit_selected(selection: IEvaluation[] | Sample[]) {
    this.selectedFiles = [];
    this.$emit('load-selected', selection);
  }

  updateEvaluations() {
    EvaluationModule.getAllEvaluations();
  }

  editItem(item: IEvaluation) {
    this.activeItem = item;
    this.editEvaluationDialog = true;
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
    if ('evaluationTags' in file) {
      file.evaluationTags?.forEach((tag) => {
        if (tag.value.toLowerCase().includes(search)) {
          result = true;
        }
      });
    }
    return result;
  }

  filterEvaluationGroups(file: IEvaluation | Sample, search: string) {
    let result = false;
    if ('groups' in file) {
      file.groups?.forEach((group) => {
        if (group.name.toLowerCase().includes(search)) {
          result = true;
        }
      });
    }
    return result;
  }

  async deleteItemConfirm(): Promise<void> {
    EvaluationModule.deleteEvaluation(this.activeItem).then(() => {
      SnackbarModule.notify('Deleted evaluation successfully.');
    });
    this.deleteItemDialog = false;
  }

  createShareLink(item: IEvaluation) {
    return `${window.location.origin}/results/${item.id}`;
  }

  get filteredFiles() {
    const matches: Array<IEvaluation | Sample> = [];
    if (this.search !== '') {
      const searchToLower = this.search.toLowerCase();
      (this.files as Array<IEvaluation | Sample>).forEach(
        async (item: IEvaluation | Sample) => {
          if (
            this.filterEvaluationTags(item, searchToLower) ||
            this.filterEvaluationGroups(item, searchToLower) ||
            item.filename.toLowerCase().includes(searchToLower)
          ) {
            matches.push(item);
          }
        }
      );
    } else {
      return this.files;
    }
    return matches;
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
