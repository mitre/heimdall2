import _Vue, { PluginFunction } from "vue";

declare class VueAnalytics {
  static install(Vue: typeof _Vue, options: any): void;
  analyticsMiddleware: any;
  onAnalyticsReady: any;
  event: any;
  ecommerce: any;
  set: any;
  page: any;
  query: any;
  screenview: any;
  time: any;
  require: any;
  exception: any;
  social: any;
  disable: any;
  enable: any;
}
export default VueAnalytics;

declare module "vue-analytics" {}

declare module "vue/types/options" {
  interface ComponentOptions<V extends _Vue> {
    ga?: VueAnalytics;
  }
}

declare module "vue/types/vue" {
  interface Vue {
    $ga: VueAnalytics;
  }
}
