<template>
  <div class="text-center">
    <v-dialog v-model="dialog" width="75%">
      <!--<template v-slot:activator="{ on }">
        <v-btn dark v-on="on">About</v-btn>
      </template>-->
      <template v-slot:activator="{ on }">
        <LinkItem :key="about" :text="about" :icon="info" v-on="on" />
      </template>
      <v-card>
        <v-card-title class="headline grey" primary-title>
          About Heimdall-Vuetify
        </v-card-title>

        <v-card-text>
          <p class="about-text">
            <br />
            Version: {{ version }} <br /><br />
            Github Repository:
            <a href="https://github.com/mitre/heimdall-vuetify"
              >https://github.com/mitre/heimdall-vuetify</a
            ><br /><br /><br /><br />
            If you would like to report an issue or suggest features,
            <a href="https://github.com/mitre/heimdall-vuetify/issues/new"
              >let us know on github.</a
            >
          </p>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <div class="flex-grow-1"></div>
          <v-btn color="primary" text @click="dialog = false">
            Close Window
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import LinkItem from "@/components/global/sidebaritems/SidebarLink.vue";

declare var process: {
  env: {
    PACKAGE_VERSION: string;
  };
};

export default {
  data() {
    return {
      dialog: false,
      about: "About",
      info: "info",
      version: process.env.PACKAGE_VERSION || "0"
    };
  },
  components: {
    LinkItem
  }
};
</script>

<style>
.about-text {
  font-size: 15pt;
}
</style>
