import {AppInfoModule, views} from '@/store/app_info';
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
      case views.Checklist: {
        // Save checklist filter state and clear filters before navigation
        FilteredDataModule.setChecklistFilterState(SearchModule.searchTerm);
        break;
      }
      case views.Result: {
        // Save results filter state and clear filters before navigation
        FilteredDataModule.setResultsFilterState(SearchModule.searchTerm);
        break;
      }
      case views.Profile: {
        // Save profiles filter state and clear filters before navigation
        FilteredDataModule.setProfilesFilterState(SearchModule.searchTerm);
        break;
      }
    }

    this.$router.push(route).catch(() => {
      // Ignore errors caused by navigation
    });
    // Set the current view
    AppInfoModule.SET_CURRENT_VIEW(route.split('/')[1] as views);
    // Sets the filter state to the page navigated to
    switch (route.split('/')[1]) {
      case views.Checklist: {
        SearchModule.updateSearch(FilteredDataModule.checklistFilterState);
        SearchModule.parseSearch();
        break;
      }
      case views.Result: {
        SearchModule.updateSearch(FilteredDataModule.resultsFilterState);
        SearchModule.parseSearch();
        break;
      }
      case views.Profile: {
        SearchModule.updateSearch(FilteredDataModule.profilesFilterState);
        SearchModule.parseSearch();
        break;
      }
    }
  }
}
