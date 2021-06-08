<template>
  <div>
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
    <v-data-table
      v-model="selectedFiles"
      :headers="headers"
      :loading="loading"
      :items="filteredFiles"
      group-by="group"
      show-select
      dense
      ><template #[`item.filename`]="{item}">
        <span class="cursor-pointer" @click="load_results([item])">{{
          item.filename
        }}</span>
      </template>
      <template #[`item.evaluationTags`]="{item}">
        <TagRow :evaluation="item"
      /></template>
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
              @update="updateEvaluations"
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
      </template></v-data-table
    ><v-btn
      block
      class="card-outter"
      :disabled="loading"
      @click="load_results(selectedFiles)"
    >
      Load Selected
      <v-icon class="pl-2"> mdi-file-download</v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import {IEvaluation, IGroup} from '@heimdall/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import TagRow from '@/components/global/tags/TagRow.vue';
import {Prop, Watch} from 'vue-property-decorator';
import {EvaluationModule} from '../../../store/evaluations';
import DeleteDialog from '@/components/generic/DeleteDialog.vue';
import ShareEvaluationButton from '@/components/generic/ShareEvaluationButton.vue';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue';
import {SnackbarModule} from '../../../store/snackbar';

@Component({
    components: {
        DeleteDialog,
        EditEvaluationModal,
        ShareEvaluationButton,
        TagRow
    }
})
export default class GroupFileList extends Vue {
    @Prop({required: true}) readonly files!: IEvaluation[];
    @Prop({type: Boolean, default: false}) readonly loading!: boolean;

    search = '';
    activeItem!: IEvaluation;
    selectedFiles: IEvaluation[] = [];
    deleteItemDialog = false;
    convertedFiles: (IEvaluation & {group: string})[] = []
    headers: Object[] = [
        {
            text: 'Filename',
            align: 'start',
            sortable: true,
            value: 'filename'
        },
        {
            text: 'Tags',
            value: 'evaluationTags',
            sortable: true
        },
        {
            text: 'Group',
            value: 'group',
            sortable: true
        },
        {
            text: 'Uploaded',
            value: 'createdAt',
            sortable: true
        },
        {
            text: 'Actions',
            value: 'actions',
            align: 'right'
        }
    ];

    @Watch('files')
    onUpdateFiles() {
        this.convertFilesToGroups();
    }

    async updateEvaluations() {
        await EvaluationModule.getAllEvaluations();
        this.convertFilesToGroups();
    }

    load_results(evaluations: IEvaluation[]) {
        this.selectedFiles = [];
        this.$emit('load-results', evaluations);
    }

    convertFilesToGroups() {
        const foundGroups: IGroup[] = [];
        this.convertedFiles = [];
        // Filter out all unique groups
        this.files.forEach((file) => {
            if(file.groups?.length !== 0){
                file.groups?.forEach((group) => {
                    if(!foundGroups.some((foundGroup) => foundGroup.id === group.id)){
                        foundGroups.push(group);
                    }
                    foundGroups.forEach((foundGroup) => {
                        if(foundGroup.id === group.id) {
                            this.convertedFiles.push({...file, group: group.name});
                        }
                    })
                })
            } else {
                this.convertedFiles.push({...file, group: 'No Group'});
            }
        })
    }

     filterEvaluationTags(file: IEvaluation, search: string): boolean {
        let result = false;
        file.evaluationTags.forEach((tag) => {
            if (tag.value.toLowerCase().includes(search)) {
                result = true;
            };
        })
        return result
    }

    get filteredFiles() {
        let matches: (IEvaluation & {group: string})[] = []
        if (this.search != '') {
            let searchToLower = this.search.toLowerCase();
            this.convertedFiles.forEach(async (item) => {
                if (this.filterEvaluationTags(item, searchToLower) || item.filename.toLowerCase().includes(searchToLower)) {
                    matches.push(item)
                }
            })
        } else {
            return this.convertedFiles;
        }
        return matches
    }

    deleteItem(item: IEvaluation) {
        this.activeItem = item;
        this.deleteItemDialog = true;
    }

    async deleteItemConfirm(): Promise<void>{
        await EvaluationModule.deleteEvaluation(this.activeItem).then(() => {
            SnackbarModule.notify("Deleted evaluation successfully.")
        })
        this.deleteItemDialog = false;
        this.updateEvaluations();
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
