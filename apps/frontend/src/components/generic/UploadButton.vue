<template>
  <div>
    <v-btn
      id="upload-btn"
      :disabled="showModal"
      class="mx-2"
      @click="show_modal"
    >
      <span class="d-none d-md-inline pr-2"> Load </span>
      <v-icon> mdi-cloud-upload </v-icon>
    </v-btn>
    <!-- File select modal -->
    <UploadNexus
      :visible="showModal"
      @close-modal="close_modal"
      @got-files="close_modal"
    />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import UploadNexus from '@/components/global/UploadNexus.vue';
import Vue from 'vue';

@Component({
  components: {
    UploadNexus
  }
})

export default class UploadButton extends Vue {
  showModal: boolean = false;
  /**
   * Invoked when file(s) are loaded.
   */
  close_modal() {
    this.showModal = false;
  }
  show_modal() {
    this.showModal = true;
  }
}
</script>
