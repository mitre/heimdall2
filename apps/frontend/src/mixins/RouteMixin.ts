import {Vue, Component} from 'vue-property-decorator';

@Component
export default class RouteMixin extends Vue {
  // get the value of the current route
  get current_route() {
    return this.$router.currentRoute.path;
  }

  // Ignore errors caused by navigating to the
  // already active path
  navigateUnlessActive(route: string): void {
    this.$router.push(route).catch(err => {
      if (err.name !== 'NavigationDuplicated') {
        throw err;
      }
    });
  }
}
