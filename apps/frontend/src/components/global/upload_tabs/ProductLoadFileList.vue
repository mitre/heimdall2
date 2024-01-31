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
          mobile-breakpoint="0"
        >
        <template #[`item.id`]="{item}">
            <span class="cursor-pointer" @click="load_results([item])">{{
              item.productId
            }}</span>
          </template>
          <template #[`item.productName`]="{item}">
            <span class="cursor-pointer" @click="load_results([item])">{{ item.productName }}</span>
          </template>
          <template #[`item.createdAt`]="{item}">
            <span class="cursor-pointer" @click="load_results([item])">{{ new Date(item.createdAt).toLocaleString() }}</span>
          </template>
        </v-data-table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import ActionDialog from '@/components/generic/ActionDialog.vue';
import CopyButton from '@/components/generic/CopyButton.vue';
import TagRow from '@/components/global/tags/TagRow.vue';
import EditEvaluationModal from '@/components/global/upload_tabs/EditEvaluationModal.vue';
import {IProduct} from '@heimdall/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    ActionDialog,
    EditEvaluationModal,
    CopyButton,
    TagRow
  }
})
export default class ProductLoadFileList extends Vue {
  @Prop({required: true}) readonly headers!: Object[];
  @Prop({type: Boolean, default: false}) readonly loading!: boolean;
  @Prop({type: String, default: 'id'}) readonly fileKey!: string;
  @Prop({type: String, default: 'productName'}) readonly sortBy!: string;
  @Prop({type: Boolean, default: true}) readonly sortDesc!: boolean;
  @Prop({required: true}) readonly files!: IProduct[];

  selectedFiles: IProduct[] = [];
  search = '';

  load_results(products: IProduct[]) {
    this.selectedFiles = [];
    this.$emit('load-results', products);
  }

  get filteredFiles() {
    const matches: Array<IProduct> = [];
    if (this.search !== '') {
      const searchToLower = this.search.toLowerCase();
      (this.files as Array<IProduct>).forEach(
        async (item: IProduct) => {
          if (
            item.productName.toLowerCase().includes(searchToLower)
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
