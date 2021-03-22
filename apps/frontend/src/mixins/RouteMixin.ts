import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class RouteMixin extends Vue {
  // get the value of the current route
  get current_route() {
    return this.$router.currentRoute.path.split('/')[1];
  }

  navigateWithNoErrors(route: string): void {
    this.$router.push(route).catch(() => {
      // Ignore errors caused by navigation
    });
  }
}
