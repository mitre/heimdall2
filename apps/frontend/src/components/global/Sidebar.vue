<template>
  <v-navigation-drawer
    v-model="drawer"
    v-bind:value="drawer"
    :clipped="$vuetify.breakpoint.lgAndUp"
    app
  >
    <v-list dense>
      <template v-for="item in items">
        <v-layout v-if="item.heading" :key="item.heading" align-center>
          <v-flex xs6>
            <v-subheader v-if="item.heading">{{ item.heading }}</v-subheader>
          </v-flex>
          <v-flex xs6 class="text-center">
            <a href="#!" class="body-2 black--text">EDIT</a>
          </v-flex>
        </v-layout>
        <v-list-group
          v-else-if="item.children"
          :key="item.text"
          v-model="item.model"
          :prepend-icon="item.model ? item.icon : item['icon-alt']"
          append-icon
        >
          <template v-slot:activator>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>{{ item.text }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
          <v-list-item
            v-for="(child, i) in item.children"
            :key="i"
            @click="$router.push('/')"
          >
            <v-list-item-action v-if="child.icon">
              <v-icon>{{ child.icon }}</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ child.text }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>
        <v-list-item v-else :key="item.text" @click="$router.push('/')">
          <v-list-item-action>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ item.text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
    <v-layout align-center>
      <v-flex xs6 class="text-center">
        <v-switch
          label="Light/Dark"
          v-model="goDark"
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

interface SidebarItem {
  text: string;
  icon?: string;
  "icon-alt"?: string;
  model?: boolean;
  children?: SidebarItem[];
}

// We declare the props separately to make props types inferable.
const SidebarProps = Vue.extend({
  props: {
    drawer: Boolean
  }
});

@Component({
  components: {}
})
export default class Sidebar extends SidebarProps {
  // Icons
  items: SidebarItem[] = [
    { icon: "contacts", text: "Contacts" },
    { icon: "history", text: "Frequently contacted" },
    { icon: "content_copy", text: "Duplicates" },
    {
      icon: "keyboard_arrow_up",
      "icon-alt": "keyboard_arrow_down",
      text: "Labels",
      model: true,
      children: [{ icon: "add", text: "Create label" }]
    },
    {
      icon: "keyboard_arrow_up",
      "icon-alt": "keyboard_arrow_down",
      text: "More",
      model: false,
      children: [
        { text: "Import" },
        { text: "Export" },
        { text: "Print" },
        { text: "Undo changes" },
        { text: "Other contacts" }
      ]
    },
    { icon: "settings", text: "Settings" },
    { icon: "chat_bubble", text: "Send feedback" },
    { icon: "help", text: "Help" },
    { icon: "phonelink", text: "App downloads" },
    { icon: "keyboard", text: "Go to the old version" }
  ];
  goDark: boolean = true;
  updateDark() {
    this.$vuetify.theme.dark = this.goDark;
  }
}
</script>
