<template>
  <v-navigation-drawer
    :value="value"
    @input="$emit('input', $event)"
    :clipped="$vuetify.breakpoint.lgAndUp"
    app
  >
    <v-list dense>
      <template v-for="item in items">
        <!-- Link lists -->
        <v-list-group v-if="item.children" :key="item.text">
          <!-- The expand toggle -->
          <template v-slot:activator>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>{{ item.text }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
          <!-- The items -->
          <LinkItem
            v-for="(child, i) in item.children"
            :key="i"
            :text="child.text"
            :icon="child.icon"
          />
        </v-list-group>

        <!-- File lists -->
        <v-list-group
          v-else-if="item.files"
          :key="item.text"
          v-model="item.model"
        >
          <!-- The expand toggle -->
          <template v-slot:activator>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>{{ item.text }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
          <!-- The items -->
          <FileItem v-for="(file, i) in item.files" :key="i" :file="file" />
        </v-list-group>

        <!-- Simple, independent links -->
        <LinkItem v-else :key="item.text" :text="item.text" :icon="item.icon" />
      </template>
    </v-list>
    <v-layout align-center>
      <v-flex class="text-center">
        <v-switch
          label="Light/Dark"
          v-model="dark"
          v-on:change="updateDark"
          align-center
        ></v-switch>
      </v-flex>
    </v-layout>
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

interface LinkProps {
  text: string; // To label the item
  icon: string; // Visually but same difference
  link?: string; // Where to redirect to
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
    FileItem
  }
})
export default class Sidebar extends SidebarProps {
  // Dynamic list setup
  get items(): AnyProp[] {
    return [
      { icon: "info", text: "Help" },
      {
        text: "Files",
        files: this.visible_files
      },
      {
        text: "Tools",
        children: [
          { text: "Import", icon: "printer" },
          { text: "Export", icon: "printer" },
          { text: "Print", icon: "printer" }
        ]
      },
      { icon: "info", text: "About" }
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
