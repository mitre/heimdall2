import {FilteredDataModule} from '@/store/data_filters';
import {SearchModule} from '@/store/search';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class RouteMixin extends Vue {
  // get the value of the current route
  get current_route() {
    return this.$router.currentRoute.path.split('/')[1];
  }

  navigateWithNoErrors(route: string): void {
    // Saves filter state of current route before navigation
    switch (this.current_route) {
      case 'checklists': {
        // Save checklist filter state and clear filters before navigation
        FilteredDataModule.setChecklistFilterState(SearchModule.searchTerm);
        SearchModule.clear();
        SearchModule.updateSearch('');
        break;
      }
      case 'results': {
        /// Save results filter state and clear filters before navigation
        FilteredDataModule.setResultsFilterState(SearchModule.searchTerm);
        SearchModule.clear();
        SearchModule.updateSearch('');
        break;
      }
      case 'profiles': {
        /// Currently will still just save the results filter state and clear filters before navigation
        FilteredDataModule.setResultsFilterState(SearchModule.searchTerm);
        SearchModule.clear();
        SearchModule.updateSearch('');
        break;
      }
    }

    this.$router.push(route).catch(() => {
      // Ignore errors caused by navigation
    });

    // Sets the filter state to the page navigated to
    switch (route) {
      case '/checklists': {
        SearchModule.updateSearch(FilteredDataModule.checklistFilterState);
        break;
      }
      case '/results': {
        SearchModule.updateSearch(FilteredDataModule.controlsFilterState);
        break;
      }
      case '/profiles': {
        SearchModule.updateSearch(FilteredDataModule.controlsFilterState);
        break;
      }
    }
  }
}
