<template>
  <v-dialog v-model="showingModal" width="580">
    <template #activator="{on}">
      <LinkItem
        key="export_print"
        text="Export through Print"
        icon="mdi-printer"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Print </v-card-title>
      <v-card-text>
        <p>
          Heimdall supports physical paper and PDF printing of displayed results
          through the HTML export feature, which leverages custom stylings
          specifically tailored for physical print and PDF generation.
          <br />
          <br />
          To use, first navigate to 'Export as HTML' in the 'Export' drop-down
          menu. Specify your desired report type and then press 'EXPORT'. Open
          your downloaded HTML file in your browser of choice and open your
          browser's print view (accessible through the browser's general
          drop-down menu or by using the shortcut CTRL + P on Windows/CMD + P on
          MacOS). Configure your print and then print your results in your
          desired format.
        </p>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import Vue from 'vue';
import Component from 'vue-class-component';

@Component({
  components: {
    LinkItem
  }
})
export default class ExportPrintModal extends Vue {
  // Default attributes
  showingModal = false;

  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
  }
}
</script>
