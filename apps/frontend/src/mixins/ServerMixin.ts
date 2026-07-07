import { Component, Vue } from 'vue-property-decorator';
import { ServerModule } from '@/store/server';

@Component({})
export default class ServerMixin extends Vue {
  // checks if heimdall is in server mode
  get serverMode() {
    return ServerModule.serverMode;
  }
}
