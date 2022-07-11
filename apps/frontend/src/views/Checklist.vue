<template>
  <Base :show-search="true">
    <template #main-content>
      <v-container fluid grid-list-md pt-0 pa-2>
        <v-card class="mt-4">
          <v-card-title>Example Card</v-card-title>
          <v-card-subtitle>Some Data here</v-card-subtitle>
        </v-card>
      </v-container>
    </template>
  </Base>
</template>

<script lang="ts">
import Vue from 'vue';
import Base from './Base.vue';
import Component from 'vue-class-component';

@Component({
  components: {
    Base
  }
})
export default class Checklist extends Vue {}
</script>
