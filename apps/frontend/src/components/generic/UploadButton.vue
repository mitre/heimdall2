<template>
  <div>
    <v-btn
      id="upload-btn"
      :disabled="showModal"
      class="mx-2"
      @click="openModal"
    >
      <span class="d-none d-md-inline pr-2"> Load </span>
      <v-icon> mdi-cloud-upload </v-icon>
    </v-btn>
    <!-- File select modal -->
    <UploadNexus
      :visible="showModal"
      @close-modal="closeModal"
      @got-files="closeModal"
    />
  </div>
</template>

<script lang="ts">
import UploadNexus from '@/components/global/UploadNexus.vue';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {
    UploadNexus
  }
})
export default class UploadButton extends Vue {
  showModal = false;
  /**
   * Invoked when file(s) are loaded.
   */
  closeModal() {
    this.showModal = false;
  }

  openModal() {
    this.showModal = true;
  }
}
</script>
