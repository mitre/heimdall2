<template>
  <div class="text-center">
    <v-menu offset-y offset-overflow :close-on-content-click="false">
      <template #activator="{on, attrs}">
        <div class="clickable-icon text-no-wrap" v-bind="attrs" v-on="on">
          <v-btn icon large>
            <template v-if="!serverMode">
              <v-avatar size="32px" item>
                <v-img
                  :src="require('@/assets/logo-xs-orange-white.svg')"
                  alt="Heimdall Logo"
                />
              </v-avatar>
            </template>
            <template v-else>
              <v-avatar size="32px" color="primary" item>
                <span
                  v-if="
                    userInfo === null ||
                    userInfo.firstName == null ||
                    userInfo.lastName == null
                  "
                  >JD</span
                >
                <span v-else>{{
                  userInfo.firstName.charAt(0) + userInfo.lastName.charAt(0)
                }}</span>
              </v-avatar>
            </template>
          </v-btn>
          <v-icon id="dropdown" small>mdi-menu-down</v-icon>
        </div>
      </template>
      <v-list id="dropdownList" class="pt-0 pb-0">
        <UserModal v-if="serverMode" id="userModal">
          <template #clickable="{on}"
            ><LinkItem key="user" text="User Info" icon="mdi-account" v-on="on"
              >My Profile</LinkItem
            >
          </template>
        </UserModal>
        <HelpModal>
          <template #clickable="{on}">
            <LinkItem
              id="helpModal"
              key="help"
              text="Help"
              icon="mdi-help-circle"
              v-on="on"
              >Help</LinkItem
            >
          </template>
        </HelpModal>
        <AboutModal>
          <template #clickable="{on}">
            <LinkItem
              id="aboutModal"
              key="about"
              text="About"
              icon="mdi-information"
              v-on="on"
              >About</LinkItem
            >
          </template>
        </AboutModal>
        <LogoutButton />
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import AboutModal from '@/components/global/AboutModal.vue';
import HelpModal from '@/components/global/HelpModal.vue';
import UserModal from '@/components/global/UserModal.vue';
import LogoutButton from '@/components/generic/LogoutButton.vue';
import ServerMixin from '@/mixins/ServerMixin';
import {ServerModule} from '@/store/server';
import {IUser} from '@heimdall/interfaces';

import Component, {mixins} from 'vue-class-component';

@Component({
  components: {
    HelpModal,
    AboutModal,
    UserModal,
    LinkItem,
    LogoutButton
  }
})
export default class TopbarDropdown extends mixins(ServerMixin) {
  userInfo: IUser | null = null;
  async getUserInfo(): Promise<void> {
    ServerModule.UserInfo().then((response) => {
      this.userInfo = response;
    });
  }
  mounted() {
    this.getUserInfo();
  }
}
</script>

<style scoped>
.clickable-icon {
  cursor: pointer;
}
</style>
