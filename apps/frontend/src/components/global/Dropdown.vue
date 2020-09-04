<template>
  <div class="text-center">
    <v-menu offset-y>
      <template v-slot:activator="{on}">
        <div color="none" dark v-on="on">
          <v-avatar size="32px" item>
            <v-img
              :src="require('@/assets/logo-xs-orange-white.svg')"
              alt="Heimdall Logo"
            ></v-img>
          </v-avatar>
        </div>
      </template>
      <v-list>
        <v-list-item v-for="(item, i) in items" :key="i">
          <v-list-item-title @click="showHelp = true">
            <v-btn color="none" @click="showHelp = true">
              Open Dialog
            </v-btn></v-list-item-title
          ><HelpModal v-show="showHelp"></HelpModal>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import {AppInfoModule} from '@/store/app_info';
import HelpModal from '@/components/global/HelpModal.vue';

export default {
  components: {
    HelpModal
  },
  data: () => ({
    showHelp: false,
    items: [
      {title: 'Help'},
      {title: 'About'},
      {title: 'Version: ' + AppInfoModule.version}
    ]
  })
};
</script>
