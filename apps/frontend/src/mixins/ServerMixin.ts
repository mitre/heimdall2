import {ServerModule} from '@/store/server';
import {Component, Vue} from 'vue-property-decorator';

@Component({})
export default class ServerMixin extends Vue {
  //checks if heimdall is in server mode
  get serverMode() {
    return ServerModule.serverMode;
  }
}
