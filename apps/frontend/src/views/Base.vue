<!--    This is the "base view" that we just modify with slots.
        Saves us the trouble of messing around with sidebar functionality
        in every view. "Subclass" by utilizing the slots. -->
<template>
  <div @drop.prevent="addFile" @dragover.prevent>
    <!-- Top appbar. The center content of it is configured via the topbar-content slot -->
    <span
      v-if="classification"
      height="1.5em"
      :style="classificationStyle"
      class="classification-footer"
      >{{ classification }}</span
    >
    <Topbar
      v-if="showTopbar"
      :title="title"
      :style="{
        'z-index': topbarZIndex,
        'margin-top': classification ? '1.5em' : '0'
      }"
      :minimal-topbar="minimalTopbar"
      :show-back-button="showBackButton"
      @toggle-drawer="drawer = !drawer"
    >
      <template #content>
        <SearchBar v-if="showSearch" />
        <slot name="topbar-content" />
      </template>
    </Topbar>

    <!-- Sidebar to navigate between different views -->
    <Sidebar v-model="drawer" @changed-files="$emit('changed-files')" />

    <!-- The actual content. Slotted by our "descendants" -->
    <v-main>
      <UpdateNotification />
      <slot name="main-content" />
    </v-main>
    <slot>
      <!-- The default slot -->
    </slot>
  </div>
</template>

<script lang="ts">
import SearchBar from '@/components/global/SearchBar.vue';
import SearchHelpModal from '@/components/global/SearchHelpModal.vue';
import Sidebar from '@/components/global/Sidebar.vue';
import Topbar from '@/components/global/Topbar.vue';
import UpdateNotification from '@/components/global/UpdateNotification.vue';
import {SidebarModule} from '@/store/sidebar_state';
import Vue from 'vue';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {InspecIntakeModule} from '../store/report_intake';
import { FilteredDataModule } from '../store/data_filters';
import { ProductModuleState } from '../store/product_module_state';
import {ServerModule} from '../store/server';
import {SnackbarModule} from '../store/snackbar';
import RouteMixin from '../mixins/RouteMixin';

@Component({
  components: {
    SearchBar,
    SearchHelpModal,
    Sidebar,
    Topbar,
    UpdateNotification
  }
})
export default class Base extends mixins(RouteMixin){
  @Prop({default: 'Heimdall'}) readonly title!: string;
  @Prop({default: 11}) readonly topbarZIndex!: number;
  @Prop({default: false}) readonly minimalTopbar!: boolean;
  @Prop({default: false}) readonly showBackButton!: boolean;
  @Prop({default: true}) readonly showTopbar!: boolean;
  @Prop({default: false}) readonly showSearch!: boolean;

  /** Models if the drawer is open */
  get drawer(): boolean {
    return SidebarModule.active;
  }

  set drawer(state: boolean) {
    SidebarModule.UpdateActive(state);
  }

  get classificationStyle() {
    return {
      background: ServerModule.classificationBannerColor,
      color: `${ServerModule.classificationBannerTextColor} !important`
    };
  }

  get classification(): string {
    return ServerModule.classificationBannerText;
  }

  addFile(event: DragEvent) {
    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      [...droppedFiles].forEach(async (file) => {
        return InspecIntakeModule.loadFile({file}).catch((err) => {
          SnackbarModule.failure(String(err));
        });
      });
    }
  }

  mounted() {
    InspecIntakeModule.detectAndLoadPredefinedJSON().then((resultLoaded) => {
      if (resultLoaded) {
        this.$router.push('/results');
      }
    });
  }
}
</script>

<style scoped>
.classification-footer {
  z-index: 1000;
  position: fixed;
  text-align: center;
  left: 0;
  right: 0;
  height: 1.6em;
  margin-top: -1.5em;
}
</style>
