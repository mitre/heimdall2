<template>
  <span class="d-flex flex-nowrap">
    <v-btn
      v-show="$vuetify.breakpoint.xs"
      id="showSearch"
      class="mr-2"
      @click="showSearch"
    >
      <v-icon>mdi-magnify</v-icon>
    </v-btn>
    <v-text-field
      v-show="showSearchMobile || !$vuetify.breakpoint.xs"
      ref="search"
      v-model="searchTerm"
      flat
      hide-details
      dense
      solo
      prepend-inner-icon="mdi-magnify"
      append-icon="mdi-help-circle-outline"
      label="Search"
      clearable
      :class="$vuetify.breakpoint.xs ? 'overtake-bar mx-2' : 'regular-bar mx-2'"
      @input="isTyping = true"
      @click:clear="searchTerm = ''"
      @click:append="showSearchHelp = true"
      @blur="showSearchMobile = false"
    />
    <SearchHelpModal
      :visible="showSearchHelp"
      style="display: none"
      @close-modal="showSearchHelp = false"
    />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import SearchHelpModal from '@/components/global/SearchHelpModal.vue';
import { SearchModule } from '@/store/search';

@Component({ components: { SearchHelpModal } })
export default class SearchBar extends Vue {
  $refs!: { search: HTMLInputElement };

  /** If we are currently showing the search help modal */
  showSearchHelp = false;

  /** Determines if we should make the search bar collapse-able */
  showSearchMobile = false;

  /**
   * If the user is currently typing in the search bar
   */
  typingTimer = setTimeout(() => {
    return;
  }, 0);

  /**
   * The current search terms, as modeled by the search bar
   */
  get searchTerm(): string {
    return SearchModule.searchTerm;
  }

  set searchTerm(term: string) {
    SearchModule.updateSearch(term);
  }

  @Watch('isTyping')
  onDoneTyping() {
    SearchModule.parseSearch();
  }

  @Watch('searchTerm')
  onUpdateSearch(_newValue: string) {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.typingTimer = setTimeout(this.onDoneTyping, 100);
  }

  /**
   * Handles focusing on the search bar
   */
  showSearch(): void {
    this.showSearchMobile = true;
    this.$nextTick(() => {
      this.$refs.search.focus();
    });
  }
}
</script>

<style scoped>
.regular-bar {
  width: 40vw;
}

.overtake-bar {
  width: 96%;
  position: absolute;
  left: 0px;
  top: 4px;
  z-index: 5;
}
</style>
