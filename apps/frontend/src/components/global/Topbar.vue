<template>
  <v-app-bar :clipped-left="$vuetify.breakpoint.lgAndUp" app color="bar">
    <!-- The title and nav bar -->
    <div v-if="!minimalTopbar">
      <v-toolbar-title id="toolbar_title" class="pr-2">
        <v-app-bar-nav-icon @click.stop="$emit('toggle-drawer')">
          <v-icon color="bar-visible">mdi-menu</v-icon>
        </v-app-bar-nav-icon>
        <span class="hidden-sm-and-down bar-visible--text">{{ title }}</span>
      </v-toolbar-title>
    </div>
    <v-spacer />

    <slot name="content" />

    <TopbarDropdown />
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
  @Prop({default: false}) readonly minimalTopbar!: boolean;

  /** Submits an event to clear all filters */
  clear(): void {
    this.$emit('clear');
  }
}
</script>
