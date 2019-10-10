<template>
  <v-navigation-drawer
    :value="value"
    @input="$emit('input', $event)"
    :clipped="$vuetify.breakpoint.lgAndUp"
    app
  >
    <v-list dense class="px-2" subheader>
      <v-subheader>Files</v-subheader>
      <FileItem v-for="(file, i) in visible_files" :key="i" :file="file" />
    </v-list>

    <v-list dense class="px-2" subheader>
      <v-subheader>Info</v-subheader>
      <AboutModal />
      <HelpModal />
    </v-list>

    <v-list dense class="px-2" subheader>
      <v-subheader>Tools</v-subheader>
      <ExportCaat></ExportCaat>
      <v-list-item>
        <div class="d-flex center-switch">
          <v-switch label="Light/Dark" v-model="dark" v-on:change="updateDark">
          </v-switch>
        </div>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { InspecFile, ExecutionFile, ProfileFile } from "@/store/report_intake";
import { getModule } from "vuex-module-decorators";
import InspecDataModule from "@/store/data_store";
import FileItem from "@/components/global/sidebaritems/SidebarFile.vue";
import LinkItem from "@/components/global/sidebaritems/SidebarLink.vue";
import ExportCaat from "@/components/global/ExportCaat.vue";
import AboutModal from "@/components/global/AboutModal.vue";
import HelpModal from "@/components/global/HelpModal.vue";

interface LinkProps {
  text: string; // To label the item
  icon: string; // Visually but same difference
  link?: string; // Where to redirect to, if we want
  on_click: () => void; // Callback function on click, if desired
}

interface FolderProps {
  text: string; // To label the item
  children: LinkProps[]; // Child links
}

interface FilesProps {
  text: string; // To label the item
  files: Array<ExecutionFile | ProfileFile>; // The files to display
}

type AnyProp = LinkProps | FolderProps | FilesProps;

// We declare the props separately to make props types inferable.
const SidebarProps = Vue.extend({
  props: {
    value: Boolean // Whether or not this item should make itself visible
  }
});

@Component({
  components: {
    LinkItem,
    FileItem,
    ExportCaat,
    AboutModal,
    HelpModal
  }
})
export default class Sidebar extends SidebarProps {
  // Dynamic list setup
  get items(): AnyProp[] {
    return [
      {
        text: "Files",
        files: this.visible_files
      },
      {
        text: "Tools",
        children: [
          { text: "Import", icon: "printer", on_click: () => {} },
          { text: "Export", icon: "printer", on_click: () => {} },
          { text: "Print", icon: "printer", on_click: () => {} }
        ]
      }
    ];
  }

  get visible_files(): Array<ProfileFile | ExecutionFile> {
    let data_store = getModule(InspecDataModule, this.$store);
    let files = data_store.allFiles;
    return files;
  }

  /** Whether or not we're dark mode */
  dark: boolean = true;

  /** Updates theme darkness */
  updateDark() {
    this.$vuetify.theme.dark = this.dark;
  }
}
</script>

<style scoped>
nav.v-navigation-drawer {
  /* Need !important as a max-height derived from the footer being always
     visible is applied directly to element by vuetify */
  max-height: 100vh !important;
  /* z-index hides behind footer and topbar */
  z-index: 1;
}
.center-switch {
  margin-left: 15px;
}
</style>
