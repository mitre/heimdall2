<template>
  <div>
    <v-btn
      id="upload-btn"
      :disabled="showingModal"
      class="mr-2"
      @click="showModal"
    >
      <span class="d-none d-md-inline pr-2"> Print </span>
      <v-icon> mdi-printer </v-icon>
    </v-btn>
    <v-dialog v-model="showingModal" width="580">
      <v-card>
        <v-card-title class="headline"> Print </v-card-title>
        <v-card-text>
          <p>
            To print, select Export | Export to HTML. Open the HTML and print.
          </p>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeModal"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {}
})
export default class PrintButton extends Vue {
  showingModal = false;
  /**
   * Invoked when file(s) are loaded.
   */
  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
  }
}
</script>
