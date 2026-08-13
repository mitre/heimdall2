import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class RouteMixin extends Vue {
  // get the value of the current route
  get current_route() {
    return this.$router.currentRoute.path.split('/', 2)[1];
  }

  // Deliberately fire-and-forget so the twelve call sites never have to
  // handle a promise that cannot reject.
  navigateWithNoErrors(route: string): void {
    void this.navigateIgnoringErrors(route);
  }

  async navigateIgnoringErrors(route: string): Promise<void> {
    try {
      await this.$router.push(route);
    } catch {
      // Ignore errors caused by navigation
    }
  }
}
