import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class RouteMixin extends Vue {
  // get the value of the current route
  get current_route() {
    return '/' + this.$router.currentRoute.path.replace(/[^a-z]/gi, '');
  }

  // Gets profiles that are loaded in vue-router
  get loadedRouterProfiles(): string[] {
    const loadedList = this.$router.currentRoute.path.split('/')[2];
    if (loadedList) {
      return loadedList.split(',');
    } else {
      return [];
    }
  }

  // Ignore errors caused by navigating to the
  // already active path
  navigateUnlessActive(route: string): void {
    this.$router.push(route).catch((err) => {
      if (err.name !== 'NavigationDuplicated') {
        throw err;
      }
    });
  }
}
