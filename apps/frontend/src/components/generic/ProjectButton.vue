<template>
  <div style="width: 100%">
    <br>
    <v-btn
      id="upload-btn"
      class="primary"
      style="width: 100%"
      @click="show_modal"
      @close-modal="close-modal"
      @got-files="close_modal-l"
    >
      <span class="d-md-inline" style="display: inline !important;"> Product/Build Selection </span>
    </v-btn>
    <ProjectModal :visible="showModal" @close-modal="close_modal"/>
  </div>
</template>

<script lang="ts">
import ProjectModal from '@/components/global/ProjectModal.vue';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {
    ProjectModal
  }
})
export default class ProjectButton extends Vue {
  showModal = false;
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
