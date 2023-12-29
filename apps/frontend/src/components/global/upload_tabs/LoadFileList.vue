<template>
  <div>
    <div class="ma-0 pa-0">
      <v-row class="mb-6" no-gutters justify="start">
        <v-col cols="3" sm="2" md="3">
          <v-text-field
            v-model="searchItems"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Filter on file name (partial or multiple values)"
            placeholder="file name"
            clearable
            hide-details="auto"
            @click:clear="clearSearchItemsClicked()"
          />
        </v-col>
        <v-col cols="3" sm="2" md="3">
          <v-text-field
            v-model="searchGroups"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Filter on group name (partial or multiple values)"
            placeholder="group name"
            clearable
            hide-details="auto"
            @click:clear="clearSearchGroupsClicked()"
          />
        </v-col>
        <v-col cols="2" sm="2" md="3">
          <v-text-field
            v-model="searchTags"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Filter on tag name (partial or multiple values)"
            placeholder="tag name"
            clearable
            hide-details="auto"
            @click:clear="clearSearchTagsClicked()"
          />
        </v-col>
        <v-col cols="2" sm="1" md="2">
          <v-tooltip top>
            <template #activator="{on, attrs}">
              <v-radio-group
                v-model="logicOperator"
                row
                v-bind="attrs"
                v-on="on"
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
            </template>
            <span>
              The logic 'AND' evaluates on both Groups and Tags,
               filename can be blank
            </span>
          </v-tooltip>
        </v-col>
        <v-col cols="1" sm="1" md="1" class="ml-n3 pt-4">
          <v-btn depressed color="primary" @click="executeSearch()">
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
          data-cy="loadFileList"
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
            <span class="cursor-pointer" @click="emit_selected([item])">
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
              :itemsPerPage="pagination.itemsPerPage"
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
              <v-icon class="pl-2"> mdi-file-download</v-icon>
            </v-btn>
          </template>
          <span>Load selected evaluation(s)</span>
        </v-tooltip>
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
import {
  IEvalPaginationParams,
  IEvaluation,
  IEvaluationTag
} from '@heimdall/interfaces';
import Vue from 'vue';
import {Prop} from 'vue-property-decorator';
import Component from 'vue-class-component';

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
  @Prop({type: Boolean, default: false}) loading!: boolean;
  @Prop({type: String, default: 'id'}) readonly fileKey!: string;
  @Prop({required: true}) evaluationsLoaded!: IEvaluation[];
  @Prop({required: true}) totalItemsPerPage!: number;
  @Prop({required: true}) evaluationsCount!: number;

  selectedFiles: IEvaluation[] = [];
  activeItem!: IEvaluation;
  activeTag!: IEvaluationTag;

  editEvaluationDialog = false;
  deleteItemDialog = false;
  deleteTagDialog = false;
  searching = false;
  setPageOnSearch = false;
  updatingPage = false;

  // Table supporting variables
  headerprops = {
    'sort-icon': 'mdi-dot', // Hack to hide the default sort icon
    'sort-by-text': 'filename' // used when rendering the mobile view
  };

  tableHight = '440px';
  page = 1;
  itemsPerPageShowing = this.totalItemsPerPage;
  pagination = {
    page: this.page,
    itemsPerPage: this.totalItemsPerPage,
    sortBy: ([] = ['createdAt']),
    sortDesc: ([] = [true]),
    groupBy: ([] = []),
    groupDesc: ([] = []),
    mustSort: false,
    multiSort: false
  };

  // Search  variable declaration
  searchItems = '';
  searchGroups = '';
  searchTags = '';
  logicOperator = 'OR';

  // Sort variables declaration
  sortByField = 'createdAt'; // Default sort field
  sortOrder = ['createdAt', 'DESC']; // db sort order

  async getEvaluations(params: IEvalPaginationParams): Promise<void> {
    console.log('Calling the db')
    EvaluationModule.getAllEvaluations(params);
    // this.evaluationsLoaded = EvaluationModule.allEvaluations;
    // this.evaluationsCount = EvaluationModule.evaluationsCount;
    console.log(`total evaluationsLoaded (DB) are: ${EvaluationModule.allEvaluations.length}`)
    console.log(`total evaluationsCount (DB) are: ${EvaluationModule.evaluationsCount}`)
  }

  clearSearchItemsClicked() {
    if (this.isEmpty(this.searchGroups) && this.isEmpty(this.searchTags)) {
      this.endSearchLoadPage();
    }
  }

  clearSearchGroupsClicked() {
    if (this.isEmpty(this.searchItems) && this.isEmpty(this.searchTags)) {
      this.endSearchLoadPage();
    }
  }

  clearSearchTagsClicked() {
    if (this.isEmpty(this.searchItems) && this.isEmpty(this.searchGroups)) {
      this.endSearchLoadPage();
    }
  }

  endSearchLoadPage() {
    this.searching = false;
    if (this.page == 1) {
      this.updateDisplayPage(this.page);
    } else {
      this.page = 1; // Reload the page
    }
  }

  isEmpty(value: string): boolean {
    return (
      value == null || (typeof value === 'string' && value.trim().length === 0)
    );
  }

  getOffSetLimit() {
    const page = this.pagination.page;
    // offset: where to start returning values
    // limit:  the number of records to return
    const limit =
    this.pagination.itemsPerPage == -1
        ? this.evaluationsCount
        : this.pagination.itemsPerPage;
    const offset = page == 1 ? 0 : (page*limit) - limit;
    return {offset, limit};
  }

  //--------------------------------------------------------------------
  // Called when the Search button is invoked (@click="executeSearch()")
  async executeSearch() {
    // Clearing the fields using the clearable icon sets the model to null
    this.searchItems = this.searchItems == null ? '' : this.searchItems;
    this.searchGroups = this.searchGroups == null ? '' : this.searchGroups;
    this.searchTags = this.searchTags == null ? '' : this.searchTags;

    if (
      this.searchItems.trim().length == 0 &&
      this.searchGroups.trim().length == 0 &&
      this.searchTags.trim().length == 0
    ) {
      SnackbarModule.notify(
        'No search criteria provided (provide a file, group, or tag name)!'
      );
    } else {
      console.log('------EXECUTE SEARCH IN-------------');
      if (this.pagination.page != 1) {
        console.log("Setting Page to 1");
        this.setPageOnSearch = !this.setPageOnSearch;
        this.pagination.page = 1;
        this.page = 1; // Set the page number
      }

      this.searching = true;
      this.getSearchEvaluation();
      console.log('------EXECUTE SEARCH OUT------------');
    }
  }

  formatSearchParam(searchValue: string): string {
    const delimiterChr = searchValue.indexOf(',') > 0 ? ',' : ' ';
    if (delimiterChr == ',') {
      // Remove any blank spaces
      searchValue = searchValue.replace(/\s/g, '');
    }
    const searchParam = searchValue.split(delimiterChr).join('|');
    return `(${searchParam})`;
  }

  async getSearchEvaluation() {
    console.log('------GET SEARCH IN------------');
    console.log(`pagination is (updateItemsPerPage 1): ${JSON.stringify(this.pagination,null,2)}`);
    this.itemsPerPageShowing = this.pagination.itemsPerPage;

    const filename =
      this.searchItems == null
        ? ''
        : this.formatSearchParam(this.searchItems.trim());
    const groups =
      this.searchGroups == null
        ? ''
        : this.formatSearchParam(this.searchGroups.trim());
    const tags =
      this.searchTags == null
        ? ''
        : this.formatSearchParam(this.searchTags.trim());
    const searchFields = [filename, groups, tags];
    const {offset, limit} = this.getOffSetLimit();
    let params: IEvalPaginationParams = {
      offset: offset,
      limit: limit,
      order: this.sortOrder
    };
    params.useClause = true;
    params.operator = this.logicOperator;
    params.searchFields = searchFields;

    // Call the Database
    await this.getEvaluations(params);
    this.evaluationsLoaded = EvaluationModule.allEvaluations;
    this.evaluationsCount = EvaluationModule.evaluationsCount;
    
    console.log(`total evaluationsLoaded are: ${this.evaluationsLoaded.length}`)
    console.log(`total evaluationsCount are: ${this.evaluationsCount}`)
    console.log('------GET SEARCH OUT------------');
  }

  //-------------------------------------------------------------------
  // Called when any of the sorted fields are invoked (@update:sort-by)
  async updateSortBy(sortField: string) {
    if (sortField.length == 0) {
      this.pagination.sortDesc[0] = false;
      this.pagination.sortBy[0] = this.sortByField;
      this.sortOrder = this.getSortClause(this.sortByField, 'ASC');
    } else {
      this.sortByField = sortField;
      this.sortOrder = this.getSortClause(this.sortByField, 'DESC');
    }

    console.log(`pagination is: ${JSON.stringify(this.pagination,null,2)}`)

    // this.totalItemsPerPage =
    //   this.pagination.itemsPerPage == -1 ? this.evaluationsCount
    //    : this.pagination.itemsPerPage;
    const {offset, limit} = this.getOffSetLimit();
    const params: IEvalPaginationParams = {
      offset: offset, limit: limit, order: this.sortOrder
    };
    console.log(`params are (updateSortBy): ${JSON.stringify(params,null,2)}`);
    
    // Call the Database
    await this.getEvaluations(params);
    this.evaluationsLoaded = EvaluationModule.allEvaluations;
    this.evaluationsCount = EvaluationModule.evaluationsCount;

    console.log(`total evaluationsLoaded are: ${this.evaluationsLoaded.length}`)
    console.log(`total evaluationsCount are: ${this.evaluationsCount}`)
    console.log("------UPDATE SORT BY OUT-------------");
  }

  getSortClause(field: string, order: string): string[] {
    //  Map sorted fields to database names.
    if (field == 'filename' || field == 'createdAt') {
      return new Array(`${field}`, `${order}`);
    } else if (field == 'groups') {
      return new Array('groups', 'name', order);
    } else if (field == 'evaluationTags') {
      return new Array('evaluationTags', 'value', order);
    } else {
      return new Array(field, order);
    }
  }

  //------------------------------------------------------------------------
  // Called when page navigation arrows are invoked (@update:items-per-page)
  // or when the Rows per page is invoked (@update:page) and not in Page 1 
  // or when the page variable is programmatically set.
  async updateDisplayPage(page: number) {
    console.log("------UPDATE DISPLAY PAGE (<- PAGE ->) IN-------------");
    console.log(`page is ${JSON.stringify(page,null,2)}`);
    console.log(`pagination are (updateDisplayPage): ${JSON.stringify(this.pagination,null,2)}`);
    
    if (this.setPageOnSearch) {
      this.setPageOnSearch = !this.setPageOnSearch;
      console.log(`setPageOnSearch is ${this.setPageOnSearch}`);
      console.log("------UPDATE DISPLAY PAGE (<- PAGE ->) OUT-------------");
      return;
    }

    this.updatingPage = true;
    //this.totalItemsPerPage = this.pagination.itemsPerPage;

    if (this.searching) {
      console.log("WE ARE SEARCHING (<- PAGE ->)")
      this.getSearchEvaluation(); 
    } else {
      console.log("WE ARE NOT SEARCHING (<- PAGE ->)")
      this.itemsPerPageShowing = this.pagination.itemsPerPage;

      const {offset, limit} = this.getOffSetLimit();
      const params: IEvalPaginationParams = {offset: offset, limit: limit, order: this.sortOrder};
      console.log(`params are (updateDisplayPage): ${JSON.stringify(params,null,2)}`)

      // Call the Database
      await this.getEvaluations({offset: offset, limit: limit, order: this.sortOrder})
      this.evaluationsLoaded = EvaluationModule.allEvaluations;
      this.evaluationsCount = EvaluationModule.evaluationsCount;

      console.log(`total evaluationsLoaded are: ${this.evaluationsLoaded.length}`)
      console.log(`total evaluationsCount are: ${this.evaluationsCount}`)
    }
    this.updatingPage = false;

    console.log("------UPDATE DISPLAY PAGE (<- PAGE ->) OUT-------------");
  }

  //----------------------------------------------------
  // Called when Rows per page is invoked (@update:page)
  // Note: If not on Page 1 the @update:items-per-page
  //       is invoked first, hence the need for the flag
  async updateItemsPerPage(itemsCount: number) {
    console.log("------UPDATE ITEMS PER PAGE IN-------------");
    console.log(`itemsCount is ${JSON.stringify(itemsCount,null,2)}`);
    console.log(`this.totalItemsPerPage is (1) ${this.totalItemsPerPage}`);
    console.log(`this.evaluationsCount ${this.evaluationsCount}`);
    console.log(`pagination is (updateItemsPerPage 1): ${JSON.stringify(this.pagination,null,2)}`);
   
    // Updating the page reset to Page 1
    //this.page = 1; 
    if (this.updatingPage) { 
      console.log("no can do, updating page");
      console.log("------UPDATE ITEMS PER PAGE OUT-------------");
      return;
    } else {
      // Occurs when we are using the Rows per page: ALL (-1)
      if (itemsCount == -1) {
        this.pagination.itemsPerPage = this.evaluationsCount;
      }      

      // If the requested items per page is greater than the total evaluations
      // we are already showing all of the evaluation, no need to query the db
      const action = this.getAction();
      console.log(`action is ${action}`);
      if (action == 'query') {
        console.log('WE ARE QUERYING');
        if (this.searching) {
          this.getSearchEvaluation();
        } else {
          console.log('NOT SEARCHING');
          this.itemsPerPageShowing = this.pagination.itemsPerPage;
          const {offset, limit} = this.getOffSetLimit();
          const params = {offset: offset, limit: limit, order: this.sortOrder};
          console.log(`Querying db with these params (updateItemsPerPage): ${JSON.stringify(params,null,2)}`);
          
          // Call the Database
          await this.getEvaluations(params);
          this.evaluationsLoaded = EvaluationModule.allEvaluations;
          this.evaluationsCount = EvaluationModule.evaluationsCount;

          console.log(`total evaluationsLoaded are: ${this.evaluationsLoaded.length}`)
          console.log(`total evaluationsCount are: ${this.evaluationsCount}`)  
        }
      } else if (action == 'slice') {
        console.log('WE ARE SLICING');
        this.itemsPerPageShowing = this.pagination.itemsPerPage;

        EvaluationModule.context.commit('SET_LOADING', true);
        const newEvaluations = this.evaluationsLoaded.slice(0, this.pagination.itemsPerPage);
        EvaluationModule.context.commit('SET_ALL_EVALUATION', newEvaluations);
        //EvaluationModule.context.commit('SET_ALL_EVALUATION_COUNT', newEvaluations.length);
        this.evaluationsLoaded = EvaluationModule.allEvaluations;
        EvaluationModule.context.commit('SET_LOADING', false);
        
        // 
        // console.log(`BEFORE -> total evaluationsLoaded are: ${this.evaluationsLoaded.length}`)
        // 
        // console.log(`AFTER -> total evaluationsLoaded are: ${this.evaluationsLoaded.length}`)
        //DatabaseReader.allEvaluations();
        
        //this.evaluationsLoaded = this.evaluationsLoaded.slice(this.pagination.itemsPerPage);
      } else {
        console.log(`DOING NOTHING - action is ${action}`);
      }
    }

    console.log(`pagination is (updateItemsPerPage 2): ${JSON.stringify(this.pagination,null,2)}`);
    console.log('------UPDATE PAGE ITEMS PER OUT-------------');
  }

  /*
    Action is based on the following:
    
    asking < showing >, =, or < totalRec -> action = slice
    asking > showing < totalRec -> action = query
    All other permutation       -> action = none

    Where:
    asking   = this.pagination.itemsPerPage
    showing  = this.itemsPerPageShowing
    totalRec = this.evaluationsCount
  */
  getAction(): string {
    console.log(`ASKING = ${this.pagination.itemsPerPage}`);
    console.log(`SHOWING = ${this.itemsPerPageShowing}`);
    console.log(`TOTALCOUNT = ${this.evaluationsCount}`);

    let action = 'none';
    if (this.pagination.itemsPerPage < this.itemsPerPageShowing) {
      action = 'slice';
    } else if (this.pagination.itemsPerPage > this.itemsPerPageShowing) {
      if (this.itemsPerPageShowing <= this.evaluationsCount) {
        action = 'query';
      }
    }      

    // if (
    //   this.pagination.itemsPerPage < this.itemsPerPageShowing && 
    //   this.itemsPerPageShowing == this.evaluationsCount
    // ) {
    //   action = 'slice';
    // } else if (
    //   this.pagination.itemsPerPage > this.itemsPerPageShowing && 
    //   this.itemsPerPageShowing < this.evaluationsCount
    // ) {
    //   action = 'query';
    // }

    return action;
  }

  emit_selected(selection: IEvaluation[]) {
    this.selectedFiles = [];
    this.$emit('load-selected', selection);
  }

  async updateEvaluations() {
    const {offset, limit} = this.getOffSetLimit();
    await this.getEvaluations({
      offset: offset,
      limit: limit,
      order: this.sortOrder
    });
    this.evaluationsLoaded = EvaluationModule.allEvaluations;
    //this.totalItemsPerPage = EvaluationModule.evaluationsCount;
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

  async deleteItemConfirm(): Promise<void> {
    EvaluationModule.deleteEvaluation(this.activeItem).then(() => {
      SnackbarModule.notify('Deleted evaluation successfully.');
    });
    this.deleteItemDialog = false;
  }

  createShareLink(item: IEvaluation) {
    return `${window.location.origin}/results/${item.id}`;
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

