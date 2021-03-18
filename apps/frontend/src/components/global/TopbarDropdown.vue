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
                <span>{{ userInitials }}</span>
              </v-avatar>
            </template>
          </v-btn>
          <v-icon id="dropdown" small>mdi-menu-down</v-icon>
        </div>
      </template>
      <v-list id="dropdownList" class="pt-0 pb-0">
        <div v-if="serverMode">
          <div v-if="isAdmin">
            <LinkItem
              key="admin"
              text="Admin Panel"
              icon="mdi-shield-account"
              link="admin"
              >Admin Panel</LinkItem
            >
            <v-divider />
          </div>
          <LinkItem
            id="groups-link"
            key="groups"
            text="My Groups"
            icon="mdi-account-group"
            link="manage-groups"
            >My Groups</LinkItem
          >
          <v-divider />
          <UserModal id="userModal" :user="userInfo">
            <template #clickable="{on}"
              ><LinkItem
                id="user-link"
                key="user"
                text="User Info"
                icon="mdi-account"
                v-on="on"
                >My Profile</LinkItem
              >
            </template>
          </UserModal>
          <LogoutButton />
          <v-divider />
        </div>
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

import Component, {mixins} from 'vue-class-component';
import {IUser} from '@heimdall/interfaces';

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
  get userInfo(): IUser {
    return ServerModule.userInfo;
  }

  get userInitials(): string {
    if (this.userInfo.firstName && this.userInfo.lastName) {
      return (
        this.userInfo.firstName.charAt(0) +
        this.userInfo.lastName.charAt(0)
      );
    } else if (this.userInfo.firstName){
      return this.userInfo.firstName.substring(0, 2);
    } else {
      return this.userInfo.email.substring(0, 2);
    }
  }

  get isAdmin(): boolean {
    return ServerModule.userInfo.role === 'admin';
  }
}
</script>

<style scoped>
.clickable-icon {
  cursor: pointer;
}
</style>
