<template>
  <div class="caption font-weight-medium">
    <div v-if="display == true">
      <VueFileAgent
        ref="vueFileAgent"
        :multiple="true"
        :accept="'.json, application/json'"
        :errorText="errorText"
        :helpText="'Choose files to upload'"
        @select="filesSelected($event)"
        v-model="fileRecords"
      ></VueFileAgent>
    </div>
    <!-- div v-else>
      <v-progress-circular
        indeterminate
        color="red"
        :size="80"
        :width="20"
      ></v-progress-circular>
    </div-->
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import vueFileAgent from 'vue-file-agent';
import 'vue-file-agent/dist/vue-file-agent.css';

Vue.use(vueFileAgent);

// We declare the props separately to make props types inferable.
const Props = Vue.extend({
  props: {}
});

/**
 * File reader component for taking in inspec JSON data.
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */

@Component({
  components: {}
})
export default class UploadButton extends Props {
  fileRecords = new Array();
  display = true;

  updated() {
    this.display = true;
  }

  filesSelected(fileRecordsNewlySelected: any) {
    // ensures icons do not show up when files are added
    this.display = false;

    var validFileRecords = fileRecordsNewlySelected.filter(
      (fileRecord: any) => !fileRecord.error
    );

    if (this.fileRecords.length == validFileRecords.length) {
      var fileToUpload = new Array();

      for (var i = 0; i < this.fileRecords.length; i++) {
        fileToUpload.push(this.fileRecords[i].file);
      }

      // ensures upload image and text does not slide over when files are added
      this.fileRecords = new Array();
      // Notify we got files
      this.$emit('files-selected', fileToUpload);
    } else {
      // ensures icons do not show up and upload image and text does not slide
      // over when files are added
      this.fileRecords = new Array();

      return this.$toasted.global.error({
        message: String(
          'One or more files provided is not in a support format.  Please ' +
            'upload file(s) in a format supported by Heimdall Lite (i.e., JSON)'
        ),
        isDark: this.$vuetify.theme.dark
      });
    }
  }
}
</script>
