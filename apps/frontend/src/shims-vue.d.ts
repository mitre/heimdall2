import Vue from 'vue';
declare module '*.vue';
declare module 'vue/types/options' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ComponentOptions<V extends Vue> {
    validations?: {[x: string]: object};
  }
}
