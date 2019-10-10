<template>
  <v-dialog v-model="dialog" width="75%">
    <template v-slot:activator="{ on }">
      <LinkItem key="help" text="Help" icon="info" v-on="on"></LinkItem>
    </template>

    <v-card>
      <v-card-title class="headline grey" primary-title>
        How to use Heimdall-Vuetify
      </v-card-title>

      <v-card-text>
        <br />
        <h1>
          View the results of an InSpec execution json
        </h1>
        <br />
        <p>
          Easily see how many controls passed and failed.<br /><br />
          Click on the donut charts to filter the controls by status and
          severity.
        </p>
        <v-img src="../../assets/data_cards.png" />
        <br />
        <hr />
        <br />
        <h1>
          Use the treemap or datatable to navigate through your controls.
        </h1>
        <br />
        <v-img src="../../assets/treemap.png" />
        <br /><br /><br />
        <v-img src="../../assets/data_table.png" />
        <br />
        <hr />
        <br />
        <h1>
          Click on a control to detect which tests passed or failed, or see its
          details and code.
        </h1>
        <br />
        <v-img src="../../assets/control_data.png" />
        <br />
        <hr />
        <br />
        <h1 class="text-center">
          View the profile before you execute it on a system.
        </h1>
        <br />
        <p class="help-text">
          The profile must be loaded into Heimdall-lite as a json value.<br />To
          create a json of a profile use the following steps:
        </p>
        <li class="help-text">
          Open a terminal to the directory of the profile.
        </li>
        <li class="help-text">
          Run the command: `inspec json [path to profile] -o [name]`
        </li>
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
</template>

<script>
import LinkItem from "@/components/global/sidebaritems/SidebarLink.vue";

export default {
  data() {
    return {
      dialog: false
    };
  },
  components: {
    LinkItem
  }
};
</script>
