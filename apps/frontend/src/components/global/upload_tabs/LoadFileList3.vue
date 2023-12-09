<template>
  <div>
    <div class="ma-0 pa-0">
      <v-row align="center">
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="searchItems"
            class="px-3 pb-1"   
            prepend-inner-icon="mdi-magnify"
            hint="Filter on file name"
            placeholder="file name"
            clearable
            hide-details="auto"
          />         
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="searchGroups"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Filter on group name"
            placeholder="group name"
            clearable
            hide-details="auto"
          />          
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="searchTags"
            class="px-3 pb-1"
            prepend-inner-icon="mdi-magnify"
            hint="Filter on tag name"
            placeholder="tag name"
            clearable
            hide-details="auto"
          />
        </v-col>
        <v-col cols="12" sm="2" md="1">
          <v-radio-group v-model="logicOperator" inline>
            <v-radio label="AND" value="and"></v-radio>
            <v-radio label="OR" value="or"></v-radio>
          </v-radio-group>         
        </v-col>
        <v-col cols="12" sm="3" md="2">
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
      <div class="d-flex flex-column" >
        <v-data-table
          v-model="selectedFiles"
          data-cy="loadFileList"
          class="pb-8 table"
          dense
          fixed-header
          mobile-breakpoint="0"
          show-select
          hide-default-header
          :headers="headers"
          :page.sync="page"              
          :items="evaluationsLoaded"
          :options.sync="pagination" 
          :loading="loading"
          :item-key="fileKey"
          :items-per-page="itemsPerPage"
          :height="tableHight"
          :footer-props="{
            showFirstLastPage: true,
            firstIcon: 'mdi-page-first',
            lastIcon: 'mdi-page-last',
            prevIcon: 'mdi-chevron-left-circle-outline',
            nextIcon: 'mdi-chevron-right-circle-outline',
            itemsPerPageOptions: [5,10,25,50,100,-1],
            itemsPerPageText: 'Rows per page:',
          }"
          @update:page="updateDisplayPage"
          @update:items-per-page="updateItemsPerPage"

        >
          <template v-slot:footer="{ props }">
            <div class="pr-10 text-right page-of-pages-div">
               <b>Page {{ props.pagination.page }} of {{ props.pagination.pageCount }}</b>
            </div>
          </template>    

<!-- custom headers slots https://colemike.com/2018/07/20/icons-in-header-slot-in-vuetify-data-table/-->
          <!-- <template #header="{ props: { headers } }"> -->
            <!-- <template v-slot:header="props" > -->
            <!-- <template v-slot:header="{ props: { headers } }"> -->
            <template slot="header" slot-scope="props">
              <thead class="v-data-table-header">
                <tr> 
                  <th>
                    <v-checkbox
                      primary
                      hide-details
                      @click.native="toggleAll"
                    ></v-checkbox>
                  </th>                
                  <th
                    v-for="header in headers"
                    :key="header.value"
                    :class="['column',   pagination.sortDesc ? 'desc' : 'asc', header.value === pagination.sortBy[0] ? 'active' : '']"  
                    @click="header.sortable ? changeSort(header.value) : ''"
                  >
                    {{ header.text }}
                    <v-icon v-if="header.sortable" class="v-data-table-header__icon" style="color:deepskyblue" medium>mdi-sort</v-icon>
                  </th>
                </tr>
              </thead>              
          </template>

          <!-- <template slot="item" slot-scope="props">
                    v-bind:class="[header.sortable ? 'sortable' : '', pagination.sortBy === header.value ? 'active': '', pagination.sortDesc ? 'desc':'asc']"          
            <tr :active="props.selected" @click="props.selected = !props.selected">
              <td>
                <v-checkbox
                  :input-value="props.selected"
                  primary
                  hide-details
                ></v-checkbox>
              </td>
              <td>{{ props.item.filename }}</td>
            </tr>

          </template> -->
          <!-- <template slot="header"  slot-scope="props">
            <tr>
              <th>
                <v-checkbox
                  :input-value="props.all"
                  :indeterminate="props.indeterminate"
                  primary
                  hide-details
                  @click.native="toggleAll"
                ></v-checkbox>
              </th>
              <th
                v-for="header in headers"
                :key="header.value"
                :class="['column sortable', pagination.sortDesc ? 'desc' : 'desc', header.value === pagination.sortBy[0] ? 'active' : '']"
                @click="changeSort(header.value)"
              >
              <v-icon>{{ pagination.sortDesc ?  'mdi-sort-descending' : 'mdi-sort-ascending' }}</v-icon>
                {{ header.text }} {{ header.value === pagination.sortBy[0] }}
              </th>
            </tr>
          </template> -->

          <!-- <template slot="item" slot-scope="props">
            <tr :active="props.selected" @click="props.selected = !props.selected">
              <td>
                <v-checkbox
                  :input-value="props.selected"
                  primary
                  hide-details
                ></v-checkbox>
              </td>
              <td>{{ props.item.filename }}</td>
              <td class="text-xs-left">{{ props.item.groups }}</td>
              <td class="text-xs-right">{{ props.item.evaluationTags }}</td>
              <td class="text-xs-left">{{ props.item.createdAt }}</td>
              <td class="text-xs-right">{{ props.item.actions }}</td>
            </tr>
          </template> -->
          
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
import {IEvalPaginationParams, IEvaluation, IEvaluationTag} from '@heimdall/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';

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
[x: string]: any;



  @Prop({required: true}) readonly headers!: Object[];
  @Prop({type: Boolean, default: false}) readonly queryingRecords!: boolean;
  @Prop({type: String, default: 'id'}) readonly fileKey!: string;
  //@Prop({type: String, default: 'createdAt'}) readonly sortBy!: string;
  //@Prop({type: Boolean, default: true}) readonly sortDesc!: boolean;
  @Prop({required: true}) readonly files!: IEvaluation[];
  @Prop({required: true}) readonly totalItemsPerPage!: number;

  evaluationsLoaded: IEvaluation[] = [];
  selectedFiles: IEvaluation[] = [];
  activeItem!: IEvaluation;
  activeTag!: IEvaluationTag;

  editEvaluationDialog = false;
  deleteItemDialog = false;
  deleteTagDialog = false;

 
  loading = this.queryingRecords;  
  page = 1;         // The starting page for the pagination component
  totalItems = 0    // Total records to display
  //numberOfPages = 0 // Total pages
  //totalPages = 0;  // The length of the pagination component
  itemsPerPage = this.totalItemsPerPage; 
  
  //fileKey = 'id';
  //search: string = '';
  searchItems = '';
  searchGroups = '';
  searchTags = '';
  logicOperator = 'or';  

  // Sort variables decleration
  sortDesc = true;                   // Set default sort order
  sortByField = 'createdAt'          // Default sort field
  sortOrder = ["createdAt", "DESC"]; // db sort order  
  sortingField = 'createdAt';        // Field we are currently sorting on
  // pagination = {
  //   sortBy: 'createdAt'
  // }
 pagination = {
  page: this.page,
  itemsPerPage: this.itemsPerPage,
  sortBy: [] = ['createdAt'],
  sortDesc: false,
  groupBy: [] = [],
  groupDesc: [] = [],
  mustSort: false,
  multiSort: false
}
  //pagination: any = {}
  //pagination.sortBy = 'createdAt'

  options: any = {};
  tableHight = '440px';




  @Watch('refresh')
  onChildChanged(newRefreshValue: boolean, _oldValue: boolean) {
    if (newRefreshValue === true) {
      // Whenever refresh is set to true, call refresh on the database results
      const {offset, limit} = this.getOffSetLimit();
      const params: IEvalPaginationParams = {offset: offset, limit: limit, order: this.sortOrder};
      this.getEvaluations(params);
    }
  }

  mounted() {
    console.log('---------------- MOUNTED -----------------')
    this.evaluationsLoaded = this.files
    this.totalItems = this.evaluationsLoaded.length;
    this.loading = false;

    console.log(`page number is: ${this.page}`)
    console.log(`totalItems are: ${this.totalItems}`)
    console.log(`pageCount is ${Math.ceil(this.totalItems/this.itemsPerPage)}`)
    //console.log(`evaluationsLoaded (3) are: ${JSON.stringify(this.evaluationsLoaded,null,2)}`)
    console.log(`options are: ${JSON.stringify(this.options,null,2)}`)

  }
  // async mounted() {
  //   console.log('---------------- START -----------------')
  //   const {offset, limit} = this.getOffSetLimit();
  //   const params: IEvalPaginationParams = {offset: offset, limit: limit, order: this.sortOrder};

  //   // EvaluationModule.getAllEvaluations(params)
  //   // .then (
  //   //   this.totalItems = EvaluationModule.evaluationsCount;  
  //   // )

  //   await this.getEvaluations(params);

  //   this.evaluationsLoaded = this.evaluations; //EvaluationModule.allEvaluations;
      
  //   console.log(`total items is: ${this.totalItems}`)
  //   //console.log(`evaluationsLoaded are: ${JSON.stringify(this.evaluationsLoaded,null,2)}`)     
  //   this.evaluationsLoaded = this.evaluations;
  // }

  async getEvaluations(params: IEvalPaginationParams): Promise<void> {
    EvaluationModule.getAllEvaluations(params)
    // console.log(`params are (awaiting): ${JSON.stringify(params,null,2)}`)
    return new Promise((resolve, reject) => {
      resolve(EvaluationModule.getAllEvaluations(params));
      reject(
        SnackbarModule.failure("Failed to retrieve any evaluations from the database.")
      );
    });  
  }

  get evaluations() {
    console.log("LOADFILE- GETTING ALL EVALUATIONS")
    //return EvaluationModule.allEvaluations;
    console.log(`evaluationsLoaded (1) are: ${JSON.stringify(this.evaluationsLoaded,null,2)}`)
    this.evaluationsLoaded = [];
    console.log(`evaluationsLoaded (2) are: ${JSON.stringify(this.evaluationsLoaded,null,2)}`)
    this.evaluationsLoaded = EvaluationModule.allEvaluations;
    this.totalItems = EvaluationModule.evaluationsCount;  
    console.log(`page number is: ${this.page}`)
    console.log(`totalItems are: ${this.totalItems}`)
    console.log(`pageCount is ${Math.ceil(this.totalItems/this.itemsPerPage)}`)
    console.log(`evaluationsLoaded (3) are: ${JSON.stringify(this.evaluationsLoaded,null,2)}`)
    console.log(`options are: ${JSON.stringify(this.options,null,2)}`)
    return this.evaluationsLoaded;

  }

  // get loading() {
  //   return EvaluationModule.loading;
  // }

  getOffSetLimit() {
    const page = this.options.page;

    // Database call
    //   offset: is the value where to start the returning values
    //   limit:  the number of records to return
    const limit = this.itemsPerPage;
    const offset = ((page*limit) - limit) + 1;
    return {offset, limit};
  }

  updateTable(thisValues: Object) {
    // emitted by the data-table when changing page, rows per page, or the sorted column/direction 
    // - will be also immediately emitted after the component was created
    console.log("------UPDATE TABLE-------")
    console.log(`values are: ${JSON.stringify(thisValues,null,2)}`)
    console.log(`while options are : ${JSON.stringify(this.options,null,2)}`)
  }

  async executeSearch() {
    console.log(`search items is ${this.searchItems}`)
    console.log(`search groups is ${this.searchGroups}`)
    console.log(`search tags is ${this.searchTags}`)
    console.log(`Operations is ${this.logicOperator}`)

    if (this.searchItems == null || this.searchGroups == null || 
        this.searchTags == null) {

      console.log('FOUND A NULL')
      // Lets update the search fields (reset the null to empty string)
      this.searchItems = this.searchItems === null ? '' : this.searchItems;
      this.searchGroups = this.searchGroups === null ? '' : this.searchGroups;
      this.searchTags = this.searchTags === null ? '' : this.searchTags;

      const {offset, limit} = this.getOffSetLimit();
      const params: IEvalPaginationParams = {offset: offset, limit: limit, order: this.sortOrder};
      await this.getEvaluations(params);
      //this.evaluationsLoaded = EvaluationModule.allEvaluations;

    } else if (this.searchItems.trim().length === 0 && 
               this.searchGroups.trim().length === 0 &&
               this.searchTags.trim().length === 0 ) {
      console.log('FOUND A EMPTY STRINGs')
      SnackbarModule.notify("No search criteria was entered in the search fields!")
    } else {
      const filename = this.searchItems === null ? '' : this.searchItems.trim();
      const groups = this.searchGroups === null ? '' : this.searchGroups.trim();
      const tags = this.searchTags === null ? '' : this.searchTags.trim();
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
      //this.evaluationsLoaded = EvaluationModule.allEvaluations;
    }
  }

  toggleAll () {
      if (this.selectedFiles.length) this.selectedFiles = []
      else this.selectedFiles = this.evaluationsLoaded.slice()
    }

  changeSort (column: string) {
    console.log(`In changeSort column is ${column}`)
    console.log(`In changeSort pagination.sortBy is ${this.pagination.sortBy[0]}`)
    console.log(`In changeSort pagination is ${JSON.stringify(this.pagination,null,2)}`)
    if (this.pagination.sortBy[0] === column) {
      this.pagination.sortDesc = !this.pagination.sortDesc;
    } else {
      this.pagination.sortBy[0] = column
      this.pagination.sortDesc = false
    }
    this.sortOrder = [`"${column}"`, `"${!this.pagination.sortDesc ? "DESC":"ASC"}"`]
    console.log(`Sorting on this field [${this.sortOrder}]`)
  } 
// :sort-by.sync="sortByField"
// :sort-desc="sortDesc"
//           @update:sort-by="updateSortBy"
  async updateSortBy(sortField: any) {
    console.log(`sortField is ${sortField}`)
    console.log(`this sortByField is ${this.sortByField}`)
    console.log(`options are (updateSortBy): ${JSON.stringify(this.options,null,2)}`)
    if (sortField === undefined) {
      console.log("UNDEFINED")
      //this.sortByField = this.sortingField;
      //this.sortDesc = true;
      this.options.sortDesc = true;
      this.options.sortByField = this.sortingField;
      console.log(`options are (updateSortBy): ${JSON.stringify(this.options,null,2)}`)
      this.sortOrder = [`"${this.sortingField}"`, "DESC"]
    } else {
      // Sort In Ascending Order - Set sortField
      console.log("GOT FIELD")
      this.sortingField = sortField;
      this.sortOrder = [`"${this.sortByField}"`, "ASC"]
    }
    
    const {offset, limit} = this.getOffSetLimit();
    const params: IEvalPaginationParams = {offset: offset, limit: limit, order: this.sortOrder};
    //await this.getEvaluations(params);
    //this.evaluationsLoaded = EvaluationModule.allEvaluations;
  }

  async updateDisplayPage(page: number) {
    console.log(`page is ${JSON.stringify(page,null,2)}`)
    console.log(`options are (updateDisplayPage): ${JSON.stringify(this.options,null,2)}`)

    const {offset, limit} = this.getOffSetLimit();
    //await this.getEvaluations({offset: offset, limit: limit, order: this.sortOrder})
    //this.evaluationsLoaded = EvaluationModule.allEvaluations;
  }

  async updateItemsPerPage(itemsCount: number) {
    console.log(`itemsCount is ${JSON.stringify(itemsCount,null,2)}`)
    console.log(`options are (updateItemsPerPage): ${JSON.stringify(this.options,null,2)}`)

    // The Items Per Page slot uses -1 to represent All items
    if (itemsCount == -1) {
      this.page = 1;

      this.itemsPerPage = EvaluationModule.evaluationsCount;
    } else {
      this.itemsPerPage = itemsCount;
    }
    const {offset, limit} = this.getOffSetLimit();
    //await this.getEvaluations({offset: offset, limit: limit, order: this.sortOrder})
    //this.evaluationsLoaded = EvaluationModule.allEvaluations;
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
/* .v-datatable thead th.column.sortable.active.desc .no-rotate {
    transform: none !important;
} */
.v-data-table-header th {
  text-transform: uppercase;
}

</style>
