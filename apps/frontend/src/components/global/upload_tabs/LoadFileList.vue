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
      <div class="d-flex flex-column" v-resize="onResize">
        <v-data-table
          v-model="selectedFiles"
          data-cy="loadFileList"
          class="pb-8"
          dense
          fixed-header
          show-select
          mobile-breakpoint="0"          
          :height="tableHight"              
          :headers="headers"
          :items="files"
          :loading="loading"
          :sort-by.sync="sortBy"
          :sort-desc="sortDesc"
          :item-key="fileKey"
          :items-per-page="itemsPerPage"
          :page-count="totalPages"
          :footer-props="{
            showFirstLastPage: true,
            firstIcon: 'mdi-arrow-collapse-left',
            lastIcon: 'mdi-arrow-collapse-right',
            prevIcon: 'mdi-arrow-left',
            nextIcon: 'mdi-arrow-right',
            'items-per-page-text':'Rows per page:',
          }"
          @update:options="loadItems"
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
                tooltip="Copy evaluation link (URL) to the clipboard"
              />
              <div v-if="item.editable">
                <v-icon
                  data-cy="edit"
                  small
                  title="Edit groups association"
                  class="mr-2"
                  @click="editItem(item)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  data-cy="delete"
                  class="mr-2"
                  small
                  title="Delete record from the database"
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
import {IEvalPaginationParams, IEvaluation, IEvaluationTag} from '@heimdall/interfaces';
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
  @Prop({required: true}) readonly itemsPerPage!: number;

  selectedFiles: IEvaluation[] | Sample[] = [];
  activeItem!: IEvaluation;
  activeTag!: IEvaluationTag;

  editEvaluationDialog = false;
  deleteItemDialog = false;
  deleteTagDialog = false;
  search = '';
  
  //itemsPerPage = 10;
  //           :items="filteredFiles"
  totalPages = 0;

  tableHight = '400px';
  tableHightValue = 400;

  onPaginationData(page: any) {
    console.log(`page is: ${page} `)
  }

  loadItems (page:any, itemsPerPage: any, sortBy: any) {
    console.log(`page is: ${JSON.stringify(page,null,2)} `)

    console.log(`itemsPerPage is: ${page.itemsPerPage} `)
    console.log(`sortBy is: ${page.sortBy} `)
    
    // @vuetable:pagination-data="onPaginationData"
    // @update:options="loadItems"
    if (page.sortBy == 'filename') {
      this.filteredFiles;
    }
  }

  mounted() {
    this.onResize()
  }

  onResize() {
    // try will fail when processing the Load Samples (LoadFileList.vue)
    // Only one header in the Load Samples panel
    try {
      const firstHeader = Object.values(this.headers[1])[0];
      this.tableHightValue = (window.innerHeight < 400) ? 400 : window.innerHeight - 250
      // this.tableHightValue = 400;
    } catch (err) {
      this.tableHightValue = 400;
    }
    this.tableHight = this.tableHightValue + 'px'
  }

  // Loads selected evaluations into visualization panel
  emit_selected(selection: IEvaluation[] | Sample[]) {
    this.selectedFiles = [];
    this.$emit('load-selected', selection);
  }

  getPagination = (page: number, size: string | number) => {
    const limit = size ? +size : this.itemsPerPage;
    const offset = page ? page * limit : 0;
  
    return { limit, offset };
  };

  updateEvaluations() {
    console.log("LoadFileList(updateEvaluations) -> CALLING EvaluationModule.getAllEvaluations")
    //EvaluationModule.getAllEvaluations();
    const params: IEvalPaginationParams = {offset: 1, limit: this.itemsPerPage, order: ["createdAt", "DESC"]};
    EvaluationModule.getAllEvaluations(params);
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
