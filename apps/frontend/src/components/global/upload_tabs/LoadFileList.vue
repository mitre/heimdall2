<template>
  <div>
    <div class="ma-0 pa-0">
      <v-row class="mb-6" nocd ../-gutters justify="start">
        <v-col cols="3" sm="2" md="3">
          <v-text-field
            v-model="searchItems"
            class="px-3 pb-1"   
            prepend-inner-icon="mdi-magnify"
            hint="Filter on file name (partial or multiple values)"
            placeholder="file name"
            clearable
            hide-details="auto"
            @click:clear="clearSearchItemsClicked(searchItems)"
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
            @click:clear="clearSearchGroupsClicked(searchGroups)"
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
            @click:clear="clearSearchTagsClicked(searchTags)"
          />
        </v-col>
        <v-col cols="2" sm="1" md="2">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-radio-group 
                v-model="logicOperator" row
                v-bind="attrs"
                v-on="on"
              >
                <v-radio value="AND">
                  <template v-slot:label>
                    <div><strong class="page-of-pages-div">AND</strong></div>
                  </template>
                </v-radio>
                <v-radio value="OR">
                  <template v-slot:label>
                    <div><strong class="page-of-pages-div">OR</strong></div>
                  </template>
                </v-radio>
              </v-radio-group>    
            </template>
            <span>The logic 'AND' evaluates on both Groups and Tags, filename can be blank</span>
          </v-tooltip>                   
        </v-col>
        <v-col cols="1" sm="1" md="1" class="ml-n3 pt-4">
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
          :headerProps="headerprops"
          :sort-by.sync="pagination.sortBy"
          :sort-desc="pagination.sortDesc"          
          :footer-props="{
            showFirstLastPage: true,
            firstIcon: 'mdi-page-first',
            lastIcon: 'mdi-page-last',
            prevIcon: 'mdi-chevron-left-circle-outline',
            nextIcon: 'mdi-chevron-right-circle-outline',
            itemsPerPageOptions: [5,10,15,25,50,100,-1],
            itemsPerPageText: 'Rows per page:',
          }"
          @update:sort-by="updateSortBy"
          @update:page="updateDisplayPage"
          @update:items-per-page="updateItemsPerPage"          
        >
          <!-- Customize the sort icon (header slot) -->
          <template v-slot:header.filename="{ header }">
            {{ header.text.toUpperCase() }}
            <v-icon v-if="header.sortable" class="v-data-table-header__icon page-of-pages-div" medium>mdi-sort</v-icon>                
          </template>
          <template v-slot:header.groups="{ header }">
            {{ header.text.toUpperCase() }}
            <v-icon v-if="header.sortable" class="v-data-table-header__icon page-of-pages-div" medium>mdi-sort</v-icon>                
          </template>
          <template v-slot:header.evaluationTags="{ header }">
            {{ header.text.toUpperCase() }}
            <v-icon v-if="header.sortable" class="v-data-table-header__icon page-of-pages-div" medium>mdi-sort</v-icon>                
          </template>
          <template v-slot:header.createdAt="{ header }">
            {{ header.text.toUpperCase() }}
            <v-icon v-if="header.sortable" class="v-data-table-header__icon page-of-pages-div" medium>mdi-sort</v-icon>                
          </template>
          <template v-slot:header.actions="{ header }">
            {{ header.text.toUpperCase() }}
            <v-icon v-if="header.sortable" class="v-data-table-header__icon page-of-pages-div" medium>mdi-sort</v-icon>                
          </template>   

          <!-- Customize pagination (footer slot)-->
          <template v-slot:footer="{ props }">
            <div class="pr-10 text-right page-of-pages-div">
               <b>Page {{ page }} of {{ props.pagination.pageCount==0?1:props.pagination.pageCount }}</b>
            </div>
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

        <!-- Load selected scan -->
        <v-tooltip top>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              block
              class="card-outter"
              :disabled="loading"
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
import {IEvalPaginationParams, IEvaluation, 
  IEvaluationTag} from '@heimdall/interfaces';
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
export default class LoadFileList3 extends Vue {
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
    "sort-icon": 'mdi-dot',    // Hack to hide the default sort icon
    "sort-by-text": "filename" // used when rendering the mobile view
  }
  tableHight = '440px';
  page = 1;
  totalItemsShowing = this.totalItemsPerPage;
  pagination = { 
    page: this.page,
    itemsPerPage: this.totalItemsPerPage,
    sortBy: [] = ['createdAt'],
    sortDesc: [] = [true],   
    groupBy: [] = [],
    groupDesc: [] = [],
    mustSort: false,
    multiSort: false
  }  

  // Search  variable declaration
  searchItems = '';
  searchGroups = '';
  searchTags = '';
  logicOperator = 'OR';  

  // Sort variables declaration
  sortByField = 'createdAt'          // Default sort field
  sortOrder = ["createdAt", "DESC"]; // db sort order  

  async getEvaluations(params: IEvalPaginationParams): Promise<void> {
    EvaluationModule.getAllEvaluations(params);
  }

  clearSearchItemsClicked(value: string) {
    console.log(`IN clearSearchItemsClicked value is ${value}`);
    if (this.isEmpty(this.searchGroups) && this.isEmpty(this.searchTags)) {
      this.endSearchLoadPage();
    }
    console.log(`Searching is ${this.searching}`);
  }

  clearSearchGroupsClicked(value: string) {
    console.log(`IN clearSearchGroupsClicked value is ${value}`);
    if (this.isEmpty(this.searchItems) && this.isEmpty(this.searchTags)) {
      this.endSearchLoadPage();
    }
    console.log(`Searching is ${this.searching}`);
  }

  clearSearchTagsClicked(value: string) {
    console.log(`IN clearSearchTagsClicked value is ${value}`);
    if (this.isEmpty(this.searchItems) && this.isEmpty(this.searchGroups)) {
      this.endSearchLoadPage();
    }
    console.log(`Searching is ${this.searching}`);
  }

  endSearchLoadPage() {
    console.log(`endSearchLoadPage-> this page is: ${this.page}`);
    this.searching = false;
    if (this.page == 1) {
      console.log("Update the display")
      this.updateDisplayPage(this.page);
    } else {
      console.log("Setting page to 1")
      this.page = 1; // Reload the page
    }
  }

  isEmpty(value: any): boolean {
    return (value == null || (typeof value === "string" && value.trim().length === 0));
  }

  getOffSetLimit() {
    const page = this.pagination.page;
    // offset: where to start returning values
    // limit:  the number of records to return
    const limit = (this.totalItemsPerPage == -1 ? this.evaluationsCount : this.totalItemsPerPage);
    const offset = (page == 1) ? 0 : ((page*limit) - limit);
    return {offset, limit};
  }

  //--------------------------------------------------------------------
  // Called when the Search button is invoked (@click="executeSearch()")
  async executeSearch() {
    console.log("------EXECUTE SEARCH IN-------------")
    console.log(`search items is ${this.searchItems}`)
    console.log(`search groups is ${this.searchGroups}`)
    console.log(`search tags is ${this.searchTags}`)
    console.log(`Operations is ${this.logicOperator}`)

    
    // Clearing the fields using the clearable icon sets the model to null
    this.searchItems = this.searchItems == null ? '' : this.searchItems;
    this.searchGroups = this.searchGroups == null ? '' : this.searchGroups;
    this.searchTags = this.searchTags == null ? '' : this.searchTags;

    if (this.searchItems.trim().length == 0 && 
        this.searchGroups.trim().length == 0 &&
        this.searchTags.trim().length == 0 ) {
      console.log('FOUND A EMPTY STRINGs')
      SnackbarModule.notify("No search criteria provided (provide a file, group, or tag name)!")
    } else {
      console.log(`this.totalItemsPerPage is ${this.totalItemsPerPage}`)
      console.log(`pagination is (executeSearch): ${JSON.stringify(this.pagination,null,2)}`)

      if(this.pagination.page != 1) {
        this.setPageOnSearch = !this.setPageOnSearch;
        this.pagination.page = 1;
        this.page = 1; // Set the page number        
      }

      this.searching = true;
      this.getSearchEvaluation();
    }
    console.log("------EXECUTE SEARCH OUT-------------")
  }

  formatSearchParam(searchValue: string): string {
    const delimiterChr = (searchValue.indexOf(',') > 0) ? ',': ' ';
    console.log(`delimiterChr is "${delimiterChr}"`)
    if (delimiterChr == ',') {
      // Remove any blank spaces
      searchValue = searchValue.replace(/\s/g, "");
    }
    const searchParam = searchValue.split(delimiterChr).join('|');
    console.log(`searchParam is ${searchParam}`)
    return `(${searchParam})`; 
  }

  async getSearchEvaluation() {
    console.log(`pagination is (getSearchEvaluation): ${JSON.stringify(this.pagination,null,2)}`)
    this.totalItemsShowing = this.totalItemsPerPage;

    const filename = this.searchItems == null ? '' : this.formatSearchParam(this.searchItems.trim());
    const groups = this.searchGroups == null ? '' : this.formatSearchParam(this.searchGroups.trim());
    const tags = this.searchTags == null ? '' : this.formatSearchParam(this.searchTags.trim());
    const searchFields = [filename,groups,tags]
    console.log(`searchFields are ${JSON.stringify(searchFields)}`)

    const {offset, limit} = this.getOffSetLimit();
    let params: IEvalPaginationParams = {
      offset: offset,
      limit: limit,
      order: this.sortOrder
    };
    params.useClause = true;
    params.operator = this.logicOperator; 
    params.searchFields = searchFields;

    console.log(`params are ${JSON.stringify(params)}`)    
    // Database
    await this.getEvaluations(params);
    this.evaluationsLoaded = EvaluationModule.allEvaluations;
    this.evaluationsCount = EvaluationModule.evaluationsCount;

    console.log(`total evaluationsLoaded are: ${this.evaluationsLoaded.length}`)
    console.log(`total evaluationsCount are: ${this.evaluationsCount}`)
  }

  //-------------------------------------------------------------------
  // Called when any of the sorted fields are invoked (@update:sort-by)
  async updateSortBy(sortField: any) {
    console.log("------UPDATE SORT BY IN-------------")
    console.log(`sortField is ${JSON.stringify(sortField,null,2)}`)
    console.log(`this sortByField is ${this.sortByField}`)
    console.log(`pagination are (1): ${JSON.stringify(this.pagination,null,2)}`)

    if (sortField.length == 0) {
      console.log("UNDEFINED - ASC")
      this.pagination.sortDesc[0] = false;
      this.pagination.sortBy[0] = this.sortByField;
      this.sortOrder = this.getSortClause(this.sortByField, 'ASC'); //[`"${this.sortByField}"`, "ASC"]
    } else {
      console.log("GOT FIELD - DESC")
      this.sortByField = sortField;
      this.sortOrder = this.getSortClause(this.sortByField, 'DESC'); 
    }

    console.log(`pagination are (2): ${JSON.stringify(this.pagination,null,2)}`)

    this.totalItemsPerPage = (this.pagination.itemsPerPage == -1 ? this.evaluationsCount : this.pagination.itemsPerPage);
    const {offset, limit} = this.getOffSetLimit();
    const params: IEvalPaginationParams = {offset: offset, limit: limit, order: this.sortOrder};
    console.log(`params are (updateSortBy): ${JSON.stringify(params,null,2)}`)
    await this.getEvaluations(params);
    this.evaluationsLoaded = EvaluationModule.allEvaluations;
    this.evaluationsCount = EvaluationModule.evaluationsCount;
    
    console.log("------UPDATE SORT BY OUT-------------")
  }

  getSortClause(field: string, order: string): string[] {
    console.log(` geSortClause field is ${field} and order is ${order}`)
    console.log(`IS FIELD === to filename: ${field == 'filename'}`)
    //  Map sorted fields to database names.
    if (field == 'filename' || field == 'createdAt') {
      return new Array(`${field}`, `${order}`);
    } else if (field == 'groups') {
      return new Array("groups", "name", order);
    } else if (field == 'evaluationTags') {
      return new Array("evaluationTags", "value", order);
    } else {
      return new Array(field, order);
    }
  }

  //------------------------------------------------------------------------
  // Called when page navigation arrows are invoked (@update:items-per-page)
  // or when the Rows per page is invoked (@update:page) and not in Page 1 
  // or when the page variable is programmatically set.
  async updateDisplayPage(page: number) {
    console.log("------UPDATE DISPLAY PAGE IN-------------")
    console.log(`page is ${JSON.stringify(page,null,2)}`)
    console.log(`pagination are (updateDisplayPage): ${JSON.stringify(this.pagination,null,2)}`)
    
    if (this.setPageOnSearch) {
      this.setPageOnSearch = !this.setPageOnSearch;
      console.log(`setPageOnSearch is ${this.setPageOnSearch}`);
      return;
    }

    this.updatingPage = true;
    this.totalItemsPerPage = this.pagination.itemsPerPage;

    if (this.searching) {
      console.log("SEARCHING")
      this.getSearchEvaluation(); 
    } else {
      console.log("NOT SEARCHING")
      
      //this.totalItemsPerPage = this.pagination.itemsPerPage;

      const {offset, limit} = this.getOffSetLimit();
      const params: IEvalPaginationParams = {offset: offset, limit: limit, order: this.sortOrder};
      console.log(`params are (updateDisplayPage): ${JSON.stringify(params,null,2)}`)
      await this.getEvaluations({offset: offset, limit: limit, order: this.sortOrder})
      this.evaluationsLoaded = EvaluationModule.allEvaluations;
      this.evaluationsCount = EvaluationModule.evaluationsCount;

      console.log(`total evaluationsLoaded are: ${this.evaluationsLoaded.length}`)
      console.log(`total evaluationsCount are: ${this.evaluationsCount}`)
    }
    
    this.updatingPage = false; 

    console.log("------UPDATE DISPLAY PAGE OUT-------------")
  }

  //----------------------------------------------------
  // Called when Rows per page is invoked (@update:page)
  async updateItemsPerPage(itemsCount: number) {
    console.log("------UPDATE ITEMS PER PAGE IN-------------")
    console.log(`itemsCount is ${JSON.stringify(itemsCount,null,2)}`)
    console.log(`this.totalItemsPerPage is (1) ${JSON.stringify(this.totalItemsPerPage,null,2)}`)
    console.log(`pagination is (updateItemsPerPage): ${JSON.stringify(this.pagination,null,2)}`)
   
    // Updating the page reset to Page 1
    //this.page = 1; 
    if (this.updatingPage) { 
      console.log("no can do, updating page")
      console.log("------UPDATE ITEMS PER PAGE OUT-------------")
      return; 
    }

    if (itemsCount != -1) {
      this.totalItemsPerPage = itemsCount      
      // we are not showing all items - do we need to query or slice showing records
      if (this.totalItemsShowing < this.evaluationsCount) {
        // We are showing more than is being asked - slice
        if (itemsCount < this.totalItemsShowing) {
          console.log("SLICING 1")
          this.evaluationsLoaded = this.evaluationsLoaded.slice(0,itemsCount);
        // Query the number of itemsCount
        } else {
          const {offset, limit} = this.getOffSetLimit();
          const params = {offset: offset, limit: limit, order: this.sortOrder};
          console.log(`Querying PARTIAL with these params (updateItemsPerPage): ${JSON.stringify(params,null,2)}`)
          await this.getEvaluations(params)
          this.evaluationsLoaded = EvaluationModule.allEvaluations;
          this.evaluationsCount = EvaluationModule.evaluationsCount;
        }
      // We are showing all items - need to slice
      } else {
        console.log("SLICING 2")
        this.evaluationsLoaded = this.evaluationsLoaded.slice(0,itemsCount);
      }

    // Asking for all items
    } else {
      this.totalItemsPerPage = this.evaluationsCount;
      const {offset, limit} = this.getOffSetLimit();
      const params = {offset: offset, limit: limit, order: this.sortOrder};
      console.log(`Querying ALL with these params (updateItemsPerPage): ${JSON.stringify(params,null,2)}`)
      await this.getEvaluations(params)
      this.evaluationsLoaded = EvaluationModule.allEvaluations;
      this.evaluationsCount = EvaluationModule.evaluationsCount;
    }

    // Update the number of records showing
    this.totalItemsShowing = this.totalItemsPerPage; //(itemsCount == -1 ? this.evaluationsCount : itemsCount);
    console.log(`total items showing is ${this.totalItemsShowing}`)
    console.log(`this.totalItemsPerPage is (2) ${this.totalItemsPerPage}`)
    console.log("------UPDATE PAGE ITEMS PER OUT-------------")
  }


  emit_selected(selection: IEvaluation[] ) {
    this.selectedFiles = [];
    this.$emit('load-selected', selection);
  }

  async updateEvaluations() {
    console.log("LoadFileList(updateEvaluations) -> CALLING EvaluationModule.getAllEvaluations")
    const {offset, limit} = this.getOffSetLimit();
    await this.getEvaluations({offset: offset, limit: limit, order: this.sortOrder})
    this.evaluationsLoaded = EvaluationModule.allEvaluations;
    this.totalItemsPerPage = EvaluationModule.evaluationsCount;
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
  font-size:0.95rem !important;
}

.table >>> .v-data-footer__select,
.table >>> .v-select__selection,
.table >>> .v-data-footer__pagination {
  font-size:0.90rem
}

</style>

