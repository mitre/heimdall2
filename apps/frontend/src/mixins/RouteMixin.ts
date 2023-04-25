import {AppInfoModule} from '@/store/app_info';
import {FilteredDataModule} from '@/store/data_filters';
import {SearchModule} from '@/store/search';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class RouteMixin extends Vue {
  // get the value of the current route
  get currentRoute() {
    return AppInfoModule.currentView;
  }

  navigateWithNoErrors(route: string): void {
    // Saves filter state of current route before navigation
    switch (this.currentRoute) {
      case 'checklists': {
        // Save checklist filter state and clear filters before navigation
        FilteredDataModule.setChecklistFilterState(SearchModule.searchTerm);
        SearchModule.clear();
        SearchModule.updateSearch('');
        break;
      }
      case 'results': {
        // Save results filter state and clear filters before navigation
        FilteredDataModule.setResultsFilterState(SearchModule.searchTerm);
        SearchModule.clear();
        SearchModule.updateSearch('');
        break;
      }
      case 'profiles': {
        // Save profiles filter state and clear filters before navigation
        FilteredDataModule.setProfilesFilterState(SearchModule.searchTerm);
        SearchModule.clear();
        SearchModule.updateSearch('');
        break;
      }
    }

    this.$router.push(route).catch(() => {
      // Ignore errors caused by navigation
    });
    // Set the current view
    AppInfoModule.SET_CURRENT_VIEW(route.split('/')[1]);
    // Sets the filter state to the page navigated to
    switch (route.split('/')[1]) {
      case 'checklists': {
        SearchModule.updateSearch(FilteredDataModule.checklistFilterState);
        break;
      }
      case 'results': {
        SearchModule.updateSearch(FilteredDataModule.resultsFilterState);
        break;
      }
      case 'profiles': {
        SearchModule.updateSearch(FilteredDataModule.profilesFilterState);
        break;
      }
    }
  }
}
