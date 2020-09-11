<template>
  <div class="text-center">
    <v-menu offset-y offset-overflow :close-on-content-click="false">
      <template v-slot:activator="{on, attrs}">
        <div class="clickable-icon" v-bind="attrs" v-on="on">
          <v-btn size="40px" icon large>
            <v-avatar size="32px" item>
              <v-img
                :src="require('@/assets/logo-xs-orange-white.svg')"
                alt="Heimdall Logo"
              ></v-img>
            </v-avatar>
          </v-btn>
          <v-icon small>mdi-menu-down</v-icon>
        </div>
      </template>
      <v-list>
        <HelpModal>
          <template v-slot:clickable="{on}">
            <LinkItem key="help" text="Help" icon="mdi-help-circle" v-on="on"
              >Help</LinkItem
            >
          </template>
        </HelpModal>
        <AboutModal>
          <template v-slot:clickable="{on}">
            <LinkItem key="about" text="About" icon="mdi-information" v-on="on"
              >About</LinkItem
            >
          </template>
        </AboutModal>
      </v-list>
    </v-menu>
  </div>
</template>

<style scoped>
.clickable-icon {
  cursor: pointer;
}
.v-list-item--link::before {
  background-color: red;
}
</style>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/SidebarLink.vue';
import AboutModal from '@/components/global/AboutModal.vue';
import HelpModal from '@/components/global/HelpModal.vue';

export default {
  components: {
    HelpModal,
    AboutModal,
    LinkItem
  }
};
</script>
