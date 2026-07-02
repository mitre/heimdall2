<template>
  <IconLinkItem
    id="logout_button"
    key="user"
    text="Logout"
    icon="mdi-logout"
    @click="logOut"
  >
    Logout
  </IconLinkItem>
</template>

<script lang="ts">
import Component, { mixins } from 'vue-class-component';
import IconLinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import ServerMixin from '@/mixins/ServerMixin';
import { ServerModule } from '@/store/server';

@Component({ components: { IconLinkItem } })
export default class LogoutButton extends mixins(ServerMixin) {
  logOut() {
    ServerModule.Logout();
  }
}
</script>
