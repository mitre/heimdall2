<template>
  <v-btn v-if="serverMode" id="logout" @click="logOut">
    <span class="d-none d-md-inline pr-2"> Logout </span>
    <v-icon> mdi-logout </v-icon>
  </v-btn>
</template>

<script lang="ts">
import ServerMixin from '@/mixins/ServerMixin';
import {ServerModule} from '@/store/server';
import Component, {mixins} from 'vue-class-component';

@Component({
  components: {}
})
export default class LogoutButton extends mixins(ServerMixin) {
  logOut() {
    ServerModule.Logout();
  }
}
</script>
