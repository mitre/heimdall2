<template>
  <div>
    <div class="ma-0 pa-0">
      <v-row
        class="mb-6"
        no-gutters
        justify="start"
      >
        <v-col
          cols="3"
          sm="2"
          md="3"
        >
          <v-text-field
            v-model="searchItems"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Filter on file name (partial or multiple values)"
            placeholder="file name"
            clearable
            hide-details="auto"
            @change="allFieldsCleared()"
            @click:clear="clearSearchItemsClicked()"
          />
        </v-col>
        <v-col
          cols="3"
          sm="2"
          md="3"
        >
          <v-text-field
            v-model="searchGroups"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Filter on group name (partial or multiple values)"
            placeholder="group name"
            clearable
            hide-details="auto"
            @change="allFieldsCleared()"
            @click:clear="clearSearchGroupsClicked()"
          />
        </v-col>
        <v-col
          cols="2"
          sm="2"
          md="3"
        >
          <v-text-field
            v-model="searchTags"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Filter on tag name (partial or multiple values)"
            placeholder="tag name"
            clearable
            hide-details="auto"
            @change="allFieldsCleared()"
            @click:clear="clearSearchTagsClicked()"
          />
        </v-col>
        <v-col
          cols="2"
          sm="1"
          md="2"
        >
          <v-radio-group
            v-model="logicOperator"
            row
          >
            <v-radio value="AND">
              <template #label>
                <div><strong class="page-of-pages-div">AND</strong></div>
              </template>
            </v-radio>
            <v-radio value="OR">
              <template #label>
                <div><strong class="page-of-pages-div">OR</strong></div>
              </template>
            </v-radio>
          </v-radio-group>
        </v-col>
        <v-col
          cols="1"
          sm="1"
          md="1"
          class="ml-n3 pt-4"
        >
          <v-btn
            depressed
            color="primary"
            @click="executeSearch()"
          >
            Search
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
          disable-pagination
          :headers="headers"
          :page.sync="page"
          :options.sync="pagination"
          :items="evaluationsLoaded"
          :server-items-length="evaluationsCount"
          :loading="loading"
          :item-key="fileKey"
          :items-per-page="totalItemsPerPage"
          :height="tableHight"
          :header-props="headerprops"
          :sort-by.sync="pagination.sortBy"
          :sort-desc="pagination.sortDesc"
          must-sort
          :footer-props="{
            showFirstLastPage: true,
            firstIcon: 'mdi-page-first',
            lastIcon: 'mdi-page-last',
            prevIcon: 'mdi-chevron-left-circle-outline',
            nextIcon: 'mdi-chevron-right-circle-outline',
            itemsPerPageOptions: [10, 50, 250, 500, 1000],
            itemsPerPageText: 'Rows per page:'
          }"
          @update:sort-by="updateSortBy"
          @update:page="updateDisplayPage"
          @update:items-per-page="updateItemsPerPage"
        >
          <!-- Customize the sort icon (header slot) -->
          <template #[`header.filename`]="{header}">
            {{ header.text.toUpperCase() }}
            <v-icon
              v-if="header.sortable"
              class="v-data-table-header__icon page-of-pages-div"
              medium
            >
              mdi-sort
            </v-icon>
          </template>
          <template #[`header.groups`]="{header}">
            {{ header.text.toUpperCase() }}
            <v-icon
              v-if="header.sortable"
              class="v-data-table-header__icon page-of-pages-div"
              medium
            >
              mdi-sort
            </v-icon>
          </template>
          <template #[`header.evaluationTags`]="{header}">
            {{ header.text.toUpperCase() }}
            <v-icon
              v-if="header.sortable"
              class="v-data-table-header__icon page-of-pages-div"
              medium
            >
              mdi-sort
            </v-icon>
          </template>
          <template #[`header.createdAt`]="{header}">
            {{ header.text.toUpperCase() }}
            <v-icon
              v-if="header.sortable"
              class="v-data-table-header__icon page-of-pages-div"
              medium
            >
              mdi-sort
            </v-icon>
          </template>
          <template #[`header.actions`]="{header}">
            {{ header.text.toUpperCase() }}
            <v-icon
              v-if="header.sortable"
              class="v-data-table-header__icon page-of-pages-div"
              medium
            >
              mdi-sort
            </v-icon>
          </template>

          <!-- Customize pagination (footer slot)-->
          <template #footer="{props}">
            <div class="pr-10 text-right page-of-pages-div">
              <b>
                Page {{ page.toLocaleString() }} of
                {{
                  props.pagination.pageCount == 0
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
              <b>No data found - try changing the search filter(s)</b>
            </div>
          </template>

          <!-- Format how to render the fields - render action events -->
          <template #[`item.filename`]="{item}">
            <span
              class="cursor-pointer"
              @click="emit_selected([item])"
            >
              {{ item.filename }}
            </span>
          </template>
          <template #[`item.groups`]="{item}">
            <GroupRow
              v-if="item.id"
              :evaluation="item"
            />
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
                >
                  mdi-delete
                </v-icon>
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
              :disabled="loading"
              v-on="on"
              @click="emit_selected(selectedFiles)"
            >
              Load Selected
              <v-icon class="pl-2">
                mdi-file-download
              </v-icon>
            </v-btn>
          </template>
          <span>Load selected item(s)</span>
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  IEvalPaginationParams,
  IEvaluation,
  IEvaluationTag,
} from '@heimdall/common/interfaces';
import Component, { mixins } from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ActionDialog from '@/components/generic/ActionDialog.vue';
import CopyButton from '@/components/generic/CopyButton.vue';
import GroupRow from '@/components/global/groups/GroupRow.vue';
import TagRow from '@/components/global/tags/TagRow.vue';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue';
import RouteMixin from '@/mixins/RouteMixin';
import { InspecDataModule } from '@/store/data_store';
import { EvaluationModule } from '@/store/evaluations';
import { SnackbarModule } from '@/store/snackbar';
import ServerMixin from '../../../mixins/ServerMixin';
import { FilteredDataModule } from '../../../store/data_filters';

@Component({
  components: {
    ActionDialog,
    CopyButton,
    EditEvaluationModal,
    GroupRow,
    TagRow,
  },
})
export default class LoadFileList extends mixins(ServerMixin, RouteMixin) {
  activeItem!: IEvaluation;
  activeTag!: IEvaluationTag;
  deleteItemDialog = false;
  deleteTagDialog = false;
  editEvaluationDialog = false;
  @Prop({ required: true }) evaluationsCount!: number;

  @Prop({ required: true }) evaluationsLoaded!: IEvaluation[];
  @Prop({ default: 'id', type: String }) readonly fileKey!: string;
  // Table supporting variables
  headerprops = {
    'sort-by-text': 'filename', // used when rendering the mobile view
    'sort-icon': 'mdi-dot', // Hack to hide the default sort icon
  };

  @Prop({ required: true }) readonly headers!: object[];
  @Prop({ required: true }) totalItemsPerPage!: number;
  itemsPerPageShowing = this.totalItemsPerPage;
  @Prop({ default: false, type: Boolean }) loading!: boolean;
  logicOperator = 'OR';
  page = EvaluationModule.page;

  pagination = {
    groupBy: ([] = []),
    groupDesc: ([] = []),
    itemsPerPage: this.totalItemsPerPage,
    multiSort: false,
    mustSort: false,
    page: this.page,
    sortBy: ([] = ['createdAt']),
    sortDesc: ([] = [true]),
  };

  searchGroups = '';
  searching = false;
  // Search  variable declaration
  searchItems = '';
  searchTags = '';

  selectedFiles: IEvaluation[] = [];
  setPageOnSearch = false;
  // Sort variables declaration
  sortByField = 'createdAt'; // Default sort field
  sortOrder = ['createdAt', 'DESC']; // db sort order

  tableHight = '440px';
  updatingPage = false;

  allFieldsCleared() {
    if (
      this.isEmpty(this.searchItems)
      && this.isEmpty(this.searchGroups)
      && this.isEmpty(this.searchTags)
    ) {
      this.endSearchLoadPage();
    }
  }

  clearSearchGroupsClicked() {
    if (this.isEmpty(this.searchItems) && this.isEmpty(this.searchTags)) {
      this.endSearchLoadPage();
    }
  }

  clearSearchItemsClicked() {
    if (this.isEmpty(this.searchGroups) && this.isEmpty(this.searchTags)) {
      this.endSearchLoadPage();
    }
  }

  clearSearchTagsClicked() {
    if (this.isEmpty(this.searchItems) && this.isEmpty(this.searchGroups)) {
      this.endSearchLoadPage();
    }
  }

  createShareLink(item: IEvaluation) {
    return `${globalThis.location.origin}/results/${item.id}`;
  }

  deleteItem(item: IEvaluation) {
    this.activeItem = item;
    this.deleteItemDialog = true;
  }

  async deleteItemConfirm(): Promise<void> {
    EvaluationModule.deleteEvaluation(this.activeItem).then(() => {
      SnackbarModule.notify('Deleted evaluation successfully.');
      this.updateEvaluations();
      const fileId = InspecDataModule.fileIdForDatabaseId(
        Number(this.activeItem.id),
      );
      if (FilteredDataModule.selected_file_ids.includes(fileId)) {
        // removes uploaded file from the currently observed files
        EvaluationModule.removeEvaluation(fileId);
        InspecDataModule.removeFile(fileId);
        // Remove any database files that may have been in the URL
        // by calling the router and causing it to write the appropriate
        // route to the URL bar
        this.navigateWithNoErrors(`/${this.current_route}`);
      }
    });
    this.deleteItemDialog = false;
  }

  deleteTag(tag: IEvaluationTag) {
    this.activeTag = tag;
    this.deleteTagDialog = true;
  }

  editItem(item: IEvaluation) {
    this.activeItem = item;
    this.editEvaluationDialog = true;
  }

  emit_selected(selection: IEvaluation[]) {
    this.selectedFiles = [];
    this.$emit('load-selected', selection);
  }

  endSearchLoadPage() {
    this.searching = false;
    if (this.page == 1) {
      this.updateDisplayPage();
    } else {
      this.page = 1; // Reload the page
    }
  }

  // --------------------------------------------------------------------
  // Called when the Search button is invoked (@click="executeSearch()")
  async executeSearch() {
    // Clearing the fields using the clearable icon sets the model to null
    this.searchItems = this.searchItems ?? '';
    this.searchGroups = this.searchGroups ?? '';
    this.searchTags = this.searchTags ?? '';

    if (
      this.searchItems.trim().length === 0
      && this.searchGroups.trim().length === 0
      && this.searchTags.trim().length === 0
    ) {
      SnackbarModule.notify(
        'No search criteria provided (provide a file, group, or tag name)!',
      );
    } else {
      if (this.pagination.page != 1) {
        this.setPageOnSearch = !this.setPageOnSearch;
        this.pagination.page = 1;
        this.page = 1; // Reset the page number
      }

      this.searching = true;
      this.getSearchEvaluation();
    }
  }

  formatSearchParam(searchValue: string): string {
    const delimiterChr = searchValue.indexOf(',') > 0 ? ',' : ' ';
    if (delimiterChr == ',') {
      // Remove any blank spaces
      searchValue = searchValue.replaceAll(/\s/gv, '');
    }
    const searchParam = searchValue.split(delimiterChr).join('|');
    return `(${searchParam})`;
  }

  /*
    Action is based on the following:

    asking < showing             -> action = slice
    asking > showing <= totalRec -> action = query
    All other permutation        -> action = none

    Where:
    asking   = this.pagination.itemsPerPage
    showing  = this.itemsPerPageShowing
    totalRec = this.evaluationsCount
  */
  getAction(): string {
    let action = 'none';
    if (this.pagination.itemsPerPage < this.itemsPerPageShowing) {
      action = 'slice';
    } else if (this.pagination.itemsPerPage > this.itemsPerPageShowing && this.itemsPerPageShowing <= this.evaluationsCount) {
      action = 'query';
    }

    return action;
  }

  async getEvaluations(params: IEvalPaginationParams): Promise<void> {
    document.body.style.cursor = 'wait';
    EvaluationModule.getAllEvaluations(params);
  }

  getOffSetLimit() {
    const page = this.pagination.page;
    // offset: where to start returning values
    // limit:  the number of records to return
    const limit
      = this.pagination.itemsPerPage == -1
        ? this.evaluationsCount
        : this.pagination.itemsPerPage;
    const offset = page == 1 ? 0 : page * limit - limit;
    return { limit, offset };
  }

  getQueryParams(): IEvalPaginationParams {
    const { limit, offset } = this.getOffSetLimit();
    let params: IEvalPaginationParams = {
      limit: limit,
      offset: offset,
      order: this.sortOrder,
    };
    return params;
  }

  async getSearchEvaluation() {
    this.itemsPerPageShowing = this.pagination.itemsPerPage;

    const filename
      = this.searchItems == null
        ? ''
        : this.formatSearchParam(this.searchItems.trim());
    const groups
      = this.searchGroups == null
        ? ''
        : this.formatSearchParam(this.searchGroups.trim());
    const tags
      = this.searchTags == null
        ? ''
        : this.formatSearchParam(this.searchTags.trim());
    const searchFields = [filename, groups, tags];

    let params = this.getQueryParams();
    params.useClause = true;
    params.operator = this.logicOperator;
    params.searchFields = searchFields;

    // Call the Database
    await this.getEvaluations(params);
    this.evaluationsLoaded = EvaluationModule.pagedEvaluations;
    this.evaluationsCount = EvaluationModule.evaluationsCount;
  }

  getSortClause(field: string, order: string): string[] {
    //  Map sorted fields to database names.
    if (field == 'filename' || field == 'createdAt') {
      return [`${field}`, `${order}`];
    } else if (field == 'groups') {
      return ['groups', 'name', order];
    } else if (field == 'evaluationTags') {
      return ['evaluationTags', 'value', order];
    } else {
      return [field, order];
    }
  }

  isEmpty(value: string): boolean {
    return (
      value == null || (typeof value === 'string' && value.trim().length === 0)
    );
  }

  // ------------------------------------------------------------------------
  // Called when page navigation arrows are invoked (@update:items-per-page)
  // or when the Rows per page is invoked (@update:page) and not in Page 1
  // or when the page variable is programmatically set.
  async updateDisplayPage() {
    if (this.setPageOnSearch) {
      this.setPageOnSearch = !this.setPageOnSearch;
      return;
    }

    this.updatingPage = true;

    if (this.searching) {
      this.getSearchEvaluation();
    } else {
      this.itemsPerPageShowing = this.pagination.itemsPerPage;

      // Call the Database - update display
      const params = this.getQueryParams();
      await this.getEvaluations(params);
      this.evaluationsLoaded = EvaluationModule.pagedEvaluations;
      this.evaluationsCount = EvaluationModule.evaluationsCount;
    }
    this.updatingPage = false;
  }

  async updateEvaluations() {
    const params = this.getQueryParams();
    this.getEvaluations(params).then(() => {
      this.evaluationsLoaded = EvaluationModule.pagedEvaluations;
    });
  }

  // ----------------------------------------------------
  // Called when Rows per page is invoked (@update:page)
  // Note: If not on Page 1 the @update:items-per-page
  //       is invoked first, hence the need for the flag
  async updateItemsPerPage(itemsCount: number) {
    // Updating the page reset to Page 1
    // this.page = 1;
    if (this.updatingPage) {
      return;
    } else {
      // Occurs when we are using the Rows per page: ALL (-1)
      if (itemsCount == -1) {
        this.pagination.itemsPerPage = this.evaluationsCount;
      }

      // If the requested items per page is greater than the total evaluations
      // we are already showing all of the evaluation, no need to query the db
      const action = this.getAction();
      if (action == 'query') {
        if (this.searching) {
          this.getSearchEvaluation();
        } else {
          this.itemsPerPageShowing = this.pagination.itemsPerPage;

          // Call the Database - update display
          const params = this.getQueryParams();
          await this.getEvaluations(params);
          this.evaluationsLoaded = EvaluationModule.pagedEvaluations;
          this.evaluationsCount = EvaluationModule.evaluationsCount;
        }
      } else if (action == 'slice') {
        this.itemsPerPageShowing = this.pagination.itemsPerPage;

        EvaluationModule.context.commit('SET_LOADING', true);
        const newEvaluations = this.evaluationsLoaded.slice(
          0,
          this.pagination.itemsPerPage,
        );
        EvaluationModule.context.commit(
          'SET_PAGED_EVALUATIONS',
          newEvaluations,
        );
        this.evaluationsLoaded = EvaluationModule.pagedEvaluations;
        EvaluationModule.context.commit('SET_LOADING', false);
      }
    }
  }

  // -------------------------------------------------------------------
  // Called when any of the sorted fields are invoked (@update:sort-by)
  async updateSortBy(sortField: string) {
    /* Hack: Implementing custom headers slots, the v-data-table sorting is
       disabled. Sort logic must be implemented by the application. The issue
       is that when any header field is clicked initially the pagination object
       is populated with the appropriate attributes, however on the second
       every other click the object pagination object is not populated. This
       could be due too how the custom header slot is implemented.

       Using local variables to maintain the sort in synchronization.
       The else block of the this.pagination.sortBy[0] == sortField is never
       executed. Leaving it here incase we rectify the implementation.
    */
    if (sortField.length === 0) {
      this.pagination.sortDesc[0]
        = this.sortOrder.at(-1) == 'DESC' ? false : true;
      this.pagination.sortBy[0] = this.sortByField;
      const sortOrder = this.pagination.sortDesc[0] ? 'DESC' : 'ASC';
      this.sortOrder = this.getSortClause(this.sortByField, sortOrder);
    } else {
      if (this.pagination.sortBy[0] == sortField) {
        this.pagination.sortDesc[0] = !this.pagination.sortDesc[0];
      } else {
        this.pagination.sortBy[0] = sortField;
        this.pagination.sortDesc[0] = false;
      }
      this.sortByField = sortField;
      const sortOrder = this.pagination.sortDesc[0] ? 'DESC' : 'ASC';
      this.sortOrder = this.getSortClause(this.sortByField, sortOrder);
    }

    // Call the Database - update display
    const params = this.getQueryParams();
    await this.getEvaluations(params);
    this.evaluationsLoaded = EvaluationModule.pagedEvaluations;
    this.evaluationsCount = EvaluationModule.evaluationsCount;
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
