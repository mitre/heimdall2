<template>
  <div class="text-center">
    <v-menu offset-y offset-overflow :close-on-content-click="false">
      <template #activator="{on, attrs}">
        <div class="clickable-icon text-no-wrap" v-bind="attrs" v-on="on">
          <v-btn icon large>
            <v-avatar size="32px" item>
              <v-img
                :src="require('@/assets/logo-xs-orange-white.svg')"
                alt="Heimdall Logo"
              />
            </v-avatar>
          </v-btn>
          <v-icon small>mdi-menu-down</v-icon>
        </div>
      </template>
      <v-list class="pt-0 pb-0">
        <UserModal>
          <template #clickable="{on}"
            ><LinkItem key="user" text="User Info" icon="mdi-account" v-on="on"
              >User Info</LinkItem
            >
          </template>
        </UserModal>
        <HelpModal>
          <template #clickable="{on}">
            <LinkItem key="help" text="Help" icon="mdi-help-circle" v-on="on"
              >Help</LinkItem
            >
          </template>
        </HelpModal>
        <AboutModal>
          <template #clickable="{on}">
            <LinkItem key="about" text="About" icon="mdi-information" v-on="on"
              >About</LinkItem
            >
          </template>
        </AboutModal>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import AboutModal from '@/components/global/AboutModal.vue';
import HelpModal from '@/components/global/HelpModal.vue';
import UserModal from '@/components/global/UserModal.vue';

import Component from 'vue-class-component';

@Component({
  components: {
    HelpModal,
    AboutModal,
    UserModal,
    LinkItem
  }
})
export default class HelpAboutDropdown extends Vue {}
</script>

<style scoped>
.clickable-icon {
  cursor: pointer;
}
</style>
