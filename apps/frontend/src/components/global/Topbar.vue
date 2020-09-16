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
      @click="showModal = true"
    >
      <span class="d-none d-md-inline pr-2">
        Load
      </span>
      <v-icon>
        mdi-cloud-upload
      </v-icon>
    </v-btn>
    <slot name="data" />
    <v-btn v-if="serverMode" id="logout" @click="logOut">
      <span class="d-none d-md-inline pr-2">
        Logout
      </span>
      <v-icon>
        mdi-logout
      </v-icon>
    </v-btn>
    <HelpAboutDropdown />
    <!-- File select modal -->
    <UploadNexus
      :visible="showModal"
      @close-modal="showModal = false"
      @got-files="on_got_files"
    />
  </v-app-bar>
</template>

<script lang="ts">
import Component, {mixins} from 'vue-class-component';
import HelpAboutDropdown from '@/components/global/HelpAboutDropdown.vue';
import {BackendModule} from '@/store/backend';
import {FileID} from '@/store/report_intake';
import UploadNexus from '@/components/global/UploadNexus.vue';
import ServerMixin from '@/mixins/ServerMixin';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    UploadNexus,
    HelpAboutDropdown
  }
})
export default class Topbar extends mixins(ServerMixin) {
  @Prop({required: true}) readonly title!: String;

  showModal: boolean = false;

  /** Submits an event to clear all filters */
  clear(): void {
    this.$emit('clear');
  }

  /**
   * Invoked when file(s) are loaded.
   */
  on_got_files(ids: FileID[]) {
    // Close the dialog
    this.showModal = false;
  }

  logOut() {
    BackendModule.Logout();
  }
}
</script>
