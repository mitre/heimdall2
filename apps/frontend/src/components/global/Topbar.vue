<template>
  <v-app-bar :clipped-left="$vuetify.breakpoint.lgAndUp" app color="bar">
    <!-- The title and nav bar -->
    <v-toolbar-title id="toolbar_title" class="pr-2">
      <v-app-bar-nav-icon @click.stop="$emit('toggle-drawer')">
        <v-icon color="bar-visible">mdi-menu</v-icon>
      </v-app-bar-nav-icon>
      <span class="hidden-sm-and-down bar-visible--text">{{ title }}</span>
    </v-toolbar-title>
    <v-spacer />

    <!-- Our customizable content -->
    <slot name="center" />

    <v-btn
      id="upload-btn"
      :disabled="showModal"
      class="mx-2"
      @click="show_modal"
    >
      <span class="d-none d-md-inline pr-2"> Load </span>
      <v-icon> mdi-cloud-upload </v-icon>
    </v-btn>
    <slot name="data" />

    <TopbarDropdown />
    <!-- File select modal -->
    <UploadNexus
      :visible="showModal"
      @close-modal="close_modal"
      @got-files="close_modal"
    />
  </v-app-bar>
</template>

<script lang="ts">
import Component, {mixins} from 'vue-class-component';
import TopbarDropdown from '@/components/global/TopbarDropdown.vue';

import UploadNexus from '@/components/global/UploadNexus.vue';
import ServerMixin from '@/mixins/ServerMixin';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    UploadNexus,
    TopbarDropdown
  }
})
export default class Topbar extends mixins(ServerMixin) {
  @Prop({type: String, required: true}) readonly title!: string;

  showModal: boolean = false;

  /** Submits an event to clear all filters */
  clear(): void {
    this.$emit('clear');
  }

  /**
   * Invoked when file(s) are loaded.
   */
  close_modal() {
    this.showModal = false;
  }

  show_modal() {
    this.showModal = true;
  }
}
</script>
