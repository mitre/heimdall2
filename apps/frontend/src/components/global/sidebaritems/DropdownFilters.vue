<template>
  <div>
    <h4 class="mt-5">{{ header }}:</h4>
    <v-row class="mt-4">
      <v-select
        v-model="currentFreeTextFilterCategory"
        class="mx-2 select"
        :items="properties"
        label="Filter Properties"
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
        :disabled="isButtonDisabled()"
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

@Component({})
export default class DropdownFilters extends Vue {
  @Prop({required: true}) readonly properties!: string[];
  @Prop({required: true}) readonly header!: string;

  currentFreeTextFilterInput = '';
  currentFreeTextFilterCategory = '';

  /** Whether category filter is inclusive or exclusive (default: inclusive)*/
  selectedRadioButton: FilterType = 'inclusive';

  isButtonDisabled() {
    // Only add the filter if a property was ever selected and there is a filter keyword
    return (
      !this.currentFreeTextFilterCategory || !this.currentFreeTextFilterInput
    );
  }

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
