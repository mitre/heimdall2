<template>
  <div>
    <h1 class="mt-5">{{ header }}:</h1>
    <v-row class="mt-4">
      <v-select
        v-model="currentFreeTextFilterCategory"
        class="mx-2 select"
        :items="categories"
        label="Filter Categories"
      />
      <v-text-field
        v-model="currentFreeTextFilterInput"
        class="mr-2"
        label="Enter filter keyword"
      />
      <v-btn
        class="mx-2"
        @click="
          addCategoryFilter(
            currentFreeTextFilterCategory,
            currentFreeTextFilterInput
          )
        "
      >
        <span>Add</span>
      </v-btn>
    </v-row>
    <v-row style="align-items: center; justify-content: center" class="mt-n5">
      <v-radio-group v-model="selectedRadioButton" row>
        <v-radio label="Inclusive (+) Filter" value="inclusive" />
        <v-radio label="Exclusive (-) Filter" value="exclusive" />
      </v-radio-group>
    </v-row>
  </div>
</template>

<script lang="ts">
import {SearchModule} from '@/store/search';
import {Component, Prop, Vue} from 'vue-property-decorator';

type FilterType = 'inclusive' | 'exclusive';

/** Free text filter category list for dropdown */
const defaultCategories = [
  'Keywords',
  'ID',
  'Vul ID',
  'Rule ID',
  'Title',
  'Nist',
  'Description',
  'Code',
  'Stig ID',
  'Classification',
  'IA Control',
  'Group Name',
  'CCIs'
];

@Component({})
export default class CategoryFilters extends Vue {
  @Prop({
    required: false,
    default() {
      return defaultCategories;
    }
  })
  readonly categories!: string[];

  @Prop({
    required: false,
    default() {
      return 'Category Filters';
    }
  })
  readonly header!: string;

  currentFreeTextFilterInput = '';
  currentFreeTextFilterCategory = '';

  /** Whether category filter is inclusive or exclusive (default: inclusive)*/
  selectedRadioButton: FilterType = 'inclusive';

  addCategoryFilter(field: string, value: string) {
    let negated = false;
    if (this.selectedRadioButton === 'exclusive') {
      negated = true;
    }
    SearchModule.addSearchFilter({
      field,
      value,
      negated
    });
  }
}
</script>
