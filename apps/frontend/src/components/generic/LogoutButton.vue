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
    // Fire-and-forget: Logout clears state and navigates on its own schedule.
    void ServerModule.Logout();
  }
}
</script>
