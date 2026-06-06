<template>
  <div>
    <div class="ma-0 pa-0">
      <v-row class="mb-6" no-gutters justify="start">
        <v-col cols="8" sm="6" md="8">
          <v-text-field
            v-model="pagination.search.value"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Search by file name, group name, or tag value"
            placeholder="Search evaluations..."
            clearable
            hide-details="auto"
            @click:clear="pagination.search.value = ''"
          />
        </v-col>
        <v-col cols="2" sm="2" md="2" class="pt-4 pl-3">
          <v-btn
            v-if="pagination.search.value"
            text
            small
            color="grey"
            @click="pagination.search.value = ''"
          >
            Clear
          </v-btn>
        </v-col>
      </v-row>
      <ActionDialog
        v-model="deleteItemDialog"
        type="file"
        @cancel="deleteItemDialog = false"
        @confirm="deleteItemConfirm"
      />
      <div class="d-flex flex-column">
        <v-data-table
          v-model="selectedFiles"
          data-cy="loadDatabaseFileList"
          class="pb-8 table"
          dense
          fixed-header
          mobile-breakpoint="0"
          show-select
          :headers="headers"
          :page.sync="pagination.page.value"
          :items="pagination.items.value"
          :server-items-length="pagination.total.value"
          :loading="pagination.loading.value"
          item-key="id"
          :items-per-page.sync="pagination.perPage.value"
          height="440px"
          must-sort
          :sort-by.sync="sortByArray"
          :sort-desc.sync="sortDescArray"
          :footer-props="{
            showFirstLastPage: true,
            firstIcon: 'mdi-page-first',
            lastIcon: 'mdi-page-last',
            prevIcon: 'mdi-chevron-left-circle-outline',
            nextIcon: 'mdi-chevron-right-circle-outline',
            itemsPerPageOptions: [10, 25, 50, 100],
            itemsPerPageText: 'Rows per page:'
          }"
        >
          <!-- Customize pagination (footer slot)-->
          <template #footer="{props}">
            <div class="pr-10 text-right page-of-pages-div">
              <b>
                Page {{ pagination.page.value.toLocaleString() }} of
                {{
                  props.pagination.pageCount === 0
                    ? 1
                    : props.pagination.pageCount.toLocaleString()
                }}
              </b>
            </div>
          </template>

          <template #[`footer.page-text`]="items">
            {{ items.pageStart.toLocaleString() }} -
            {{ items.pageStop.toLocaleString() }} of
            {{ items.itemsLength.toLocaleString() }}
          </template>

          <!-- Format the No Data Message -->
          <template slot="no-data">
            <div class="title font-weight-light page-of-pages-div">
              <b>No data found - try changing the search filter</b>
            </div>
          </template>

          <!-- Format how to render the fields - render action events -->
          <template #[`item.filename`]="{item}">
            <span class="cursor-pointer" @click="loadSelected([item])">
              {{ item.filename }}
            </span>
          </template>
          <template #[`item.groups`]="{item}">
            <GroupRow v-if="item.id" :evaluation="item" />
          </template>
          <template #[`item.evaluationTags`]="{item}">
            <TagRow
              v-if="item.id"
              :evaluation="item"
              :on-loading-panel="true"
            />
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
                @close="closeEditDialog"
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
                  title="Edit record (name, visibility, groups)"
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

        <!-- Load selected scan -->
        <v-tooltip top>
          <template #activator="{on, attrs}">
            <v-btn
              v-bind="attrs"
              block
              class="card-outter"
              :disabled="pagination.loading.value"
              v-on="on"
              @click="loadSelected(selectedFiles)"
            >
              Load Selected
              <v-icon class="pl-2"> mdi-file-download</v-icon>
            </v-btn>
          </template>
          <span>Load selected item(s)</span>
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref, computed, watch, onMounted} from 'vue';
import axios from 'axios';
import ActionDialog from '@/components/generic/ActionDialog.vue';
import CopyButton from '@/components/generic/CopyButton.vue';
import GroupRow from '@/components/global/groups/GroupRow.vue';
import TagRow from '@/components/global/tags/TagRow.vue';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue';
import {useServerPagination} from '@/composables/useServerPagination';
import {EvaluationModule} from '@/store/evaluations';
import {SnackbarModule} from '@/store/snackbar';
import {InspecDataModule} from '@/store/data_store';
import {FilteredDataModule} from '@/store/data_filters';
import type {IEvaluation} from '@heimdall/common/interfaces';

async function fetchEvaluations(params: {
  page: number;
  perPage: number;
  sort: string;
  order: 'asc' | 'desc';
  q: string | undefined;
}) {
  const {data} = await axios.get('/evaluations', {
    params: {
      page: params.page,
      per_page: params.perPage,
      sort: params.sort,
      order: params.order,
      q: params.q,
    },
  });
  return {
    data: data.evaluations as IEvaluation[],
    meta: data.meta ?? {
      total: data.totalCount ?? 0,
      page: params.page,
      perPage: params.perPage,
      totalPages: Math.ceil((data.totalCount ?? 0) / params.perPage) || 1,
    },
  };
}

export default defineComponent({
  name: 'LoadFileList',
  components: {ActionDialog, EditEvaluationModal, CopyButton, GroupRow, TagRow},
  props: {
    headers: {type: Array, required: true},
  },
  emits: ['load-selected'],
  setup(props, {emit}) {
    const pagination = useServerPagination<IEvaluation>(fetchEvaluations, {
      defaultPerPage: 25,
      defaultSort: 'createdAt',
      defaultOrder: 'desc',
    });

    const selectedFiles = ref<IEvaluation[]>([]);
    const activeItem = ref<IEvaluation | null>(null);
    const editEvaluationDialog = ref(false);
    const deleteItemDialog = ref(false);

    const sortByArray = computed({
      get: () => [pagination.sort.value],
      set: (val: string[]) => {
        if (val.length > 0 && val[0]) {
          pagination.sort.value = val[0];
        }
      },
    });

    const sortDescArray = computed({
      get: () => [pagination.order.value === 'desc'],
      set: (val: boolean[]) => {
        pagination.order.value = val[0] ? 'desc' : 'asc';
      },
    });

    function loadSelected(evaluations: IEvaluation[]) {
      if (evaluations.length === 0) {
        SnackbarModule.notify(
          'Please select an entry for viewing in the visualization panel',
        );
        return;
      }
      selectedFiles.value = [];
      emit('load-selected', evaluations);
    }

    function editItem(item: IEvaluation) {
      activeItem.value = item;
      editEvaluationDialog.value = true;
    }

    function closeEditDialog() {
      editEvaluationDialog.value = false;
      pagination.fetch();
    }

    function deleteItem(item: IEvaluation) {
      activeItem.value = item;
      deleteItemDialog.value = true;
    }

    async function deleteItemConfirm() {
      if (!activeItem.value) return;
      try {
        await EvaluationModule.deleteEvaluation(activeItem.value);
        SnackbarModule.notify('Deleted evaluation successfully.');
        const fileId = await InspecDataModule.loadedFileIsForDatabaseIds(
          Number(activeItem.value.id),
        );
        if (fileId && FilteredDataModule.selected_file_ids.includes(fileId)) {
          EvaluationModule.removeEvaluation(fileId);
          InspecDataModule.removeFile(fileId);
        }
        pagination.fetch();
      } catch (err) {
        SnackbarModule.failure(
          err instanceof Error ? err.message : 'Failed to delete evaluation',
        );
      }
      deleteItemDialog.value = false;
    }

    function createShareLink(item: IEvaluation): string {
      return `${window.location.origin}/results/${item.id}`;
    }

    onMounted(() => {
      pagination.fetch();
    });

    return {
      pagination,
      selectedFiles,
      activeItem,
      editEvaluationDialog,
      deleteItemDialog,
      sortByArray,
      sortDescArray,
      loadSelected,
      editItem,
      closeEditDialog,
      deleteItem,
      deleteItemConfirm,
      createShareLink,
    };
  },
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
.card-outter {
  position: absolute;
  bottom: 0;
}
.page-of-pages-div {
  color: deepskyblue !important;
}
.table >>> th {
  font-size: 0.95rem !important;
}

.table >>> .v-data-footer__select,
.table >>> .v-select__selection,
.table >>> .v-data-footer__pagination {
  font-size: 0.96rem;
}
</style>
