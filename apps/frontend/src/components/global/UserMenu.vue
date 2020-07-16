<template>
  <v-menu open-on-hover offset-y v-if="is_server_mode">
    <template v-slot:activator="{ on, attrs }">
      <v-btn class="mx-2" v-on="on">
        <v-icon>
          mdi-account
        </v-icon>
      </v-btn>
    </template>
    <v-list>
      <v-list-item @click="profile_page">
        <v-list-item-title>Profile</v-list-item-title>
      </v-list-item>
      <v-list-item @click="log_out">
        <v-list-item-title>Logout</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

// We declare the props separately to make props types inferable.
const UserMenuProps = Vue.extend({
  props: {}
});

@Component({
  components: {}
})
export default class UserMenu extends UserMenuProps {}
</script>
