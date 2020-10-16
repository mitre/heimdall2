<template>
  <v-sheet>
    <v-toolbar dense ma-4 pa-4>
      <v-spacer />
      <v-toolbar-items>
        <template v-if="$vuetify.breakpoint.smAndUp">
          <v-btn icon>
            <v-icon>mdi-export-variant</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon>mdi-delete-circle</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon>mdi-plus-circle</v-icon>
          </v-btn>
        </template>
      </v-toolbar-items>
    </v-toolbar>
  </v-sheet>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {}
})
export default class Toolbar extends Vue {}
</script>
