<template>
  <v-dialog
    :value="state.visible"
    persistent
    max-width="450"
    @keydown.esc="cancel"
  >
    <v-card>
      <v-card-title class="headline">
        {{ state.title }}
      </v-card-title>
      <v-card-text>
        {{ state.message }}
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          @click="cancel"
        >
          {{ state.cancelText }}
        </v-btn>
        <v-btn
          color="primary"
          text
          @click="ok"
        >
          {{ state.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { confirmDialogState, resolve } from '@/utilities/confirm_service';

@Component
export default class ConfirmDialog extends Vue {
  get state() {
    return confirmDialogState;
  }

  cancel() {
    resolve(false);
  }

  ok() {
    resolve(true);
  }
}
</script>
