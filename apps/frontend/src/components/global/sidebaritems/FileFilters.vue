<template>
  <CategoryFilters :categories="categories" :header="header" />
</template>

<script lang="ts">
import {Vue, Component} from 'vue-property-decorator';
import CategoryFilters from './CategoryFilters.vue';

@Component({
  components: {
    CategoryFilters
  }
})
export default class FileFilters extends Vue {
  readonly header = 'File Filters';
  readonly categories = ['File Name'];
}
</script>
