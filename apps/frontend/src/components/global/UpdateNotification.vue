<template>
  <v-banner
    v-model="updateAvailable"
    icon="mdi-alert"
    color="light-blue darken-1"
    single-line
  >
    There is a newer version of Heimdall available. The latest version is
    <strong>v{{ latestVersion }}</strong> and you are running
    <strong>v{{ version }}</strong
    >.
    <template #actions>
      <v-btn text :href="repository + changelog" target="_blank" color="black"
        >Learn More</v-btn
      >
      <v-btn text color="red darken-4" @click="updateAvailable = false"
        >Dismiss</v-btn
      >
    </template>
  </v-banner>
</template>

<script lang="ts">
import AppInfoMixin from '@/mixins/AppInfoMixin';
import {AppInfoModule} from '@/store/app_info';
import { ServerModule } from '@/store/server';
import Vue from 'vue';
import Component, { mixins } from 'vue-class-component';

@Component({})
export default class UpdateNotification extends mixins(AppInfoMixin) {
  get updateAvailable(): boolean {
    return (!ServerModule.serverMode || ServerModule.userInfo.role === 'admin') && AppInfoModule.updateNotification;
  }
  set updateAvailable(visible: boolean) {
    AppInfoModule.SetUpdateVisibility(visible);
  }
  get latestVersion(): string {
    return AppInfoModule.latestVersion;
  }

}
</script>
