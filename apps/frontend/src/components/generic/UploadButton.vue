<template>
  <div>
    <v-btn id="upload-btn" ref="openUpload" class="mx-2" @click="show_upload">
      <span class="d-none d-md-inline pr-2"> Load </span>
      <v-icon> mdi-cloud-upload </v-icon>
    </v-btn>
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import {SidebarModule} from '../../store/sidebar_state';

@Component({})
export default class UploadButton extends Vue {
  show_upload() {
    SidebarModule.UpdateActive(false);
    this.$router.push('/');
  }
}
</script>
