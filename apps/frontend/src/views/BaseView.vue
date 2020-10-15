<!--    This is the "base view" that we just modify with slots.
        Saves us the trouble of messing around with sidebar functionality
        in every view. "Subclass" by utilizing the slots. -->
<template>
  <div>
    <!-- Top appbar. The center content of it is configured via the topbar-content slot -->
    <Topbar :title="title" @toggle-drawer="drawer = !drawer">
      <template #center>
        <slot name="topbar-content" />
      </template>
      <template #data>
        <slot name="topbar-data" />
      </template>
    </Topbar>

    <!-- Sidebar to navigate between different views -->
    <Sidebar v-model="drawer">
      <slot name="sidebar-content-tools" />
    </Sidebar>

    <!-- The actual content. Slotted by our "descendants" -->
    <v-main>
      <slot name="main-content" />
    </v-main>

    <slot>
      <!-- The default slot -->
    </slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Sidebar from '@/components/global/Sidebar.vue';
import Topbar from '@/components/global/Topbar.vue';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    Sidebar,
    Topbar
  }
})
export default class Base extends Vue {
  @Prop({default: 'Heimdall'}) readonly title!: string;
  /** Models if the drawer is open */
  drawer: boolean = true;
}
</script>
