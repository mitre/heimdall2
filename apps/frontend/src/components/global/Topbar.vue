<template>
  <v-app-bar :clipped-left="$vuetify.breakpoint.lgAndUp" app color="bar" dense>
    <!-- The title and nav bar -->
    <v-toolbar-title v-if="!minimalTopbar" id="toolbar_title" class="pr-2">
      <v-app-bar-nav-icon @click.stop="$emit('toggle-drawer')">
        <v-icon color="bar-visible">mdi-menu</v-icon>
      </v-app-bar-nav-icon>
      <span class="hidden-sm-and-down bar-visible--text">{{
        elipsisTitle
      }}</span>
    </v-toolbar-title>
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
import {HeightsModule} from '@/store/heights';

@Component({
  components: {
    UploadNexus,
    TopbarDropdown
  }
})
export default class Topbar extends mixins(ServerMixin) {
  @Prop({type: String, required: true}) readonly title!: string;
  @Prop({default: false}) readonly minimalTopbar!: boolean;

  mounted() {
    this.$nextTick(function () {
      HeightsModule.setTopbarHeight(this.$el.clientHeight);
    })
  }

  /** Submits an event to clear all filters */
  clear(): void {
    this.$emit('clear');
  }

  get elipsisTitle() {
    return this.title.length > 50 ? `${this.title.substring(0, 50)}...` : this.title;
  }
}
</script>
