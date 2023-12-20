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
            itemsPerPageOptions: [5,10,25,50,100,-1],
            itemsPerPageText: 'Rows per page:',
          }"
          @update:sort-by="updateSortBy"
          @update:page="updateDisplayPage"
          @update:items-per-page="updateItemsPerPage"

        >
          <!-- Customize the sort icon (header slot)-->
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
               <b>Page {{ props.pagination.page }} of {{ props.pagination.pageCount }}</b>
            </div>
          </template>    
          
          <!-- Format how to render the fields - provide action events -->
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
import * as _ from 'lodash';


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
  // @Prop({type: String, default: 'createdAt'}) readonly sortBy!: string;
  // @Prop({type: Boolean, default: true}) readonly sortDesc!: boolean;
  @Prop({required: true}) evaluationsLoaded!: IEvaluation[];
  @Prop({required: true}) totalItemsPerPage!: number;
  @Prop({required: true}) readonly evaluationsCount!: number;
  
  //evaluationsLoaded: IEvaluation[] = [];
  selectedFiles: IEvaluation[] = [];
  activeItem!: IEvaluation;
  activeTag!: IEvaluationTag;

  editEvaluationDialog = false;
  deleteItemDialog = false;
  deleteTagDialog = false;

  // Table supporting variables
  headerprops = {
    "sort-icon": 'mdi-dot',    // Hack to hide the default sort icon
    "sort-by-text": "filename" // used when rendering the mobile view
  }
  tableHight = '440px';
  page = 1;
  totalItemsShowing = 0;
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
  sortOrder = ["createdAt", "DESC"];  // db sort order  

  async getEvaluations(params: IEvalPaginationParams): Promise<void> {
    EvaluationModule.getAllEvaluations(params);
  }

  getOffSetLimit() {
    const page = this.pagination.page;

    // Database call
    //   offset: is the value where to start the returning values
    //   limit:  the number of records to return
    const limit = (this.totalItemsPerPage == -1 ? this.evaluationsCount : this.totalItemsPerPage);
    const offset = (page == 1) ? 0 : ((page*limit) - limit);
    return {offset, limit};
  }

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

    // if (this.searchItems == null || this.searchGroups == null || 
    //     this.searchTags == null) {

      //console.log('FOUND A NULL')
      // Lets update the search fields (reset the null to empty string)
      //const nullCnt = this.getNulLSearchCount();


      // const {offset, limit} = this.getOffSetLimit();
      // const params: IEvalPaginationParams = {offset: offset, limit: limit, order: this.sortOrder};
      // await this.getEvaluations(params);
      // this.evaluationsLoaded = EvaluationModule.allEvaluations;
     // SnackbarModule.notify("No search criteria provided (provide a file, group, or tag name)!")
    if (this.searchItems.trim().length == 0 && 
        this.searchGroups.trim().length == 0 &&
        this.searchTags.trim().length == 0 ) {
      
      console.log('FOUND A EMPTY STRINGs')
      SnackbarModule.notify("No search criteria provided (provide a file, group, or tag name)!")
    } else {
      const filename = this.searchItems == null ? '' : this.formatSearchParam(this.searchItems.trim());
      const groups = this.searchGroups == null ? '' : this.formatSearchParam(this.searchGroups.trim());
      const tags = this.searchTags == null ? '' : this.formatSearchParam(this.searchTags.trim());
      const fields = [filename,groups,tags]
      console.log(`fields are ${JSON.stringify(fields)}`)

      const {offset, limit} = this.getOffSetLimit();
      let params: IEvalPaginationParams = {
        offset: offset,
        limit: limit,
        order: this.sortOrder
      };
      params.useClause = true;
      params.operator = this.logicOperator; 
      params.fields = fields;

      console.log(`params are ${JSON.stringify(params)}`)    
      // Database
      await this.getEvaluations(params);
      this.evaluationsLoaded = EvaluationModule.allEvaluations;
    }
    console.log("------EXECUTE SEARCH OUT-------------")
  }

  // getNulLSearchCount(): number {
  //   let cntNull = 0;
  //   if (this.searchItems == null) {cntNull++};
  //   if (this.searchGroups == null) {cntNull++};
  //   if (this.searchTags == null) {cntNull++};
  //   return cntNull;
  // }

  formatSearchParam(searchValue: string): string {
    const delimiterChr = (searchValue.indexOf(',') > 0) ? ',': ' ';
    console.log(`delimiterChr is ${delimiterChr}`)
    const searchParam = _.replace(searchValue, delimiterChr, '|')
    console.log(`searchParam is ${searchParam}`)
    return `(${searchParam})`; 
  }

  // customSort(items: any, index: any, isDesc: any) {
  //   console.log("------CUSTOM SORT IN-------------")
  //   console.log(`items is ${JSON.stringify(items,null,2)}`)
  //   console.log(`index is ${JSON.stringify(index,null,2)}`)
  //   console.log(`isDesc is ${JSON.stringify(isDesc,null,2)}`)

  //   console.log("------CUSTOM SORT OUT-------------")
  // }

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
    
    console.log("------UPDATE SORT BY OUT-------------")
  }

  /* Map sorted fields to database names.
     Needed because the query for getting the evaluations is a (only groups and tags have different )
  */
  getSortClause(field: string, order: string): string[] {
    console.log(` geSortClause field is ${field} and order is ${order}`)
    console.log(`IS FIELD === to filename: ${field == 'filename'}`)

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

  // Called when page navigation arrows are invoked (@update:items-per-page)  
  async updateDisplayPage(page: number) {
    console.log("------UPDATE DISPLAY PAGE IN-------------")
    console.log(`page is ${JSON.stringify(page,null,2)}`)
    console.log(`pagination are (updateDisplayPage): ${JSON.stringify(this.pagination,null,2)}`)
    
    this.totalItemsPerPage = this.pagination.itemsPerPage;

    const {offset, limit} = this.getOffSetLimit();
    const params: IEvalPaginationParams = {offset: offset, limit: limit, order: this.sortOrder};
    console.log(`params are (updateDisplayPage): ${JSON.stringify(params,null,2)}`)
    await this.getEvaluations({offset: offset, limit: limit, order: this.sortOrder})
    this.evaluationsLoaded = EvaluationModule.allEvaluations;
    console.log("------UPDATE DISPLAY PAGE OUT-------------")
  }

  // Called when Rows per page is invoked (@update:page)
  async updateItemsPerPage(itemsCount: number) {
    console.log("------UPDATE PAGE IN-------------")
    console.log(`itemsCount is ${JSON.stringify(itemsCount,null,2)}`)
    console.log(`this.totalItemsPerPage is (1) ${JSON.stringify(this.totalItemsPerPage,null,2)}`)
    console.log(`pagination is (updateItemsPerPage): ${JSON.stringify(this.pagination,null,2)}`)
   
    // Updating the page reset to Page 1
    this.page = 1; 
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
    }

    // Update the number of records showing
    this.totalItemsShowing = this.totalItemsPerPage; //(itemsCount == -1 ? this.evaluationsCount : itemsCount);
    console.log(`total items showing is ${this.totalItemsShowing}`)
    console.log(`this.totalItemsPerPage is (2) ${JSON.stringify(this.totalItemsPerPage,null,2)}`)
    console.log("------UPDATE PAGE OUT-------------")
  }


  emit_selected(selection: IEvaluation[] ) {
    this.selectedFiles = [];
    this.$emit('load-selected', selection);
  }

  updateEvaluations() {
    console.log("LoadFileList(updateEvaluations) -> CALLING EvaluationModule.getAllEvaluations")
    const {offset, limit} = this.getOffSetLimit();
    this.getEvaluations({offset: offset, limit: limit, order: this.sortOrder})
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

function f() {
  throw new Error('Function not implemented.');
}

function f() {
  throw new Error('Function not implemented.');
}

function delay(arg0: number) {
  throw new Error('Function not implemented.');
}

function getEvaluations(params: any, IEvalPaginationParams: any) {
  throw new Error('Function not implemented.');
}

function evaluations() {
  throw new Error('Function not implemented.');
}

function getOffSetLimit() {
  throw new Error('Function not implemented.');
}

function executeSearch() {
  throw new Error('Function not implemented.');
}

function updateSortBy(sortField: any, any: any) {
  throw new Error('Function not implemented.');
}

function updateDisplayPage(page: any, number: any) {
  throw new Error('Function not implemented.');
}

function updateItemsPerPage(itemsCount: any, number: any) {
  throw new Error('Function not implemented.');
}

function emit_selected(selection: any, arg1: any) {
  throw new Error('Function not implemented.');
}

function updateEvaluations() {
  throw new Error('Function not implemented.');
}

function editItem(item: any, IEvaluation: any) {
  throw new Error('Function not implemented.');
}

function deleteItem(item: any, IEvaluation: any) {
  throw new Error('Function not implemented.');
}

function deleteTag(tag: any, IEvaluationTag: any) {
  throw new Error('Function not implemented.');
}

function deleteItemConfirm() {
  throw new Error('Function not implemented.');
}

function createShareLink(item: any, IEvaluation: any) {
  throw new Error('Function not implemented.');
}
