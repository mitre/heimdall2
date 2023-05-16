<template>
  <div class="text-center">
    <v-menu>
      <template #activator="{on, attrs}">
        <v-btn v-bind="attrs" class="mr-2" v-on="on">
          <span class="d-none d-md-inline mr-2"> Export </span>
          <v-icon> mdi-file-export </v-icon>
        </v-btn>
      </template>
      <v-list class="py-0">
        <slot />
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component
export default class ExportButton extends Vue {}
</script>
