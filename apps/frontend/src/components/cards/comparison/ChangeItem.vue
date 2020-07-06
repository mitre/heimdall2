<!-- Visualizes a delta between two controls -->
<template>
  <v-row>
    <v-col class="pa-0" cols="1">
      <v-card class="pa-2" outlined tile>
        <slot name="name" />
      </v-card>
    </v-col>
    <v-col class="pa-0" cols="5">
      <v-card class="pa-2" outlined tile>
        <slot name="old" />
      </v-card>
    </v-col>
    <v-col class="pa-1" cols="1" align-self="center">
      <v-icon> arrow_forward </v-icon>
    </v-col>
    <v-col class="pa-0" cols="5">
      <v-card class="pa-2" outlined tile>
        <slot name="new" />
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({});
</script>
