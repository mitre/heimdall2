import {AppInfoModule} from '@/store/app_info';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class AppInfoMixin extends Vue {
  get version(): string {
    return AppInfoModule.version;
  }
  get changelog(): string {
    return AppInfoModule.changelog;
  }
  get repository(): string {
    return AppInfoModule.repository;
  }
  get branch(): string {
    return AppInfoModule.branch;
  }
}
