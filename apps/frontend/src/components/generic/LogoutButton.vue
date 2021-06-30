<template>
  <IconLinkItem
    id="logout_button"
    key="user"
    text="Logout"
    icon="mdi-logout"
    @click="logOut"
    >Logout</IconLinkItem
  >
</template>

<script lang="ts">
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import ServerMixin from '@/mixins/ServerMixin';
import {ServerModule} from '@/store/server';
import Component, {mixins} from 'vue-class-component';

@Component({
  components: {
    IconLinkItem
  }
})
export default class LogoutButton extends mixins(ServerMixin) {
  logOut() {
    ServerModule.Logout();
  }
}
</script>
