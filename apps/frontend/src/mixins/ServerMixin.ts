import {BackendModule} from '@/store/backend';
import {Vue, Component} from 'vue-property-decorator';

@Component
export default class ServerMixin extends Vue {
  //checks if heimdall is in server mode
  get serverMode() {
    return BackendModule.serverMode;
  }
}
