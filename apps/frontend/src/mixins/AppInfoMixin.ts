import { Component, Vue } from 'vue-property-decorator';
import { AppInfoModule } from '@/store/app_info';

@Component({})
export default class AppInfoMixin extends Vue {
  get branch(): string {
    return AppInfoModule.branch;
  }

  get changelog(): string {
    return AppInfoModule.changelog;
  }

  get repository(): string {
    return AppInfoModule.repository;
  }

  get version(): string {
    return AppInfoModule.version;
  }
}
