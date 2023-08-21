<template>
  <v-dialog v-model="showingModal" width="580">
    <template #activator="{on}">
      <LinkItem
        key="export_html"
        text="Export as HTML"
        icon="mdi-language-html5"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Export as HTML </v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <v-radio-group v-model="exportType">
              <v-radio
                label="Executive Report"
                :value="FileExportTypes.Executive"
              />
              <v-radio
                label="Manager Report"
                :value="FileExportTypes.Manager"
              />
              <v-radio
                label="Administrator Report"
                :value="FileExportTypes.Administrator"
              />
            </v-radio-group>
          </v-col>
          <v-col>
            <pre class="pt-5" v-text="description" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Cancel </v-btn>
        <v-btn color="primary" :disabled="!exportType" text @click="exportHTML">
          Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {s2ab} from '@/utilities/export_util';
import {saveAs} from 'file-saver';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
import {Filter} from '../../store/data_filters';
import {InspecDataModule} from '../../store/data_store';
import {SnackbarModule} from '../../store/snackbar';
import {FromHDFToHTMLMapper} from '@mitre/hdf-converters';

// All selectable export types for an HTML export
enum FileExportTypes {
  Executive = 'Executive',
  Manager = 'Manager',
  Administrator = 'Administrator'
}

// All corresponding descriptions for export types
const enum FileExportDescriptions {
  Executive = 'Profile Info\nStatuses\nCompliance Level',
  Manager = 'Profile Info\nStatuses\nCompliance Level\nTest Results and Details',
  Administrator = 'Profile Info\nStatuses\nCompliance Level\nTest Results and Details\nTest Code'
}

@Component({
  components: {
    LinkItem
  }
})
export default class ExportHTMLModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  // If we are exporting a profile we can remove the test/results table
  @Prop({type: String, required: true}) readonly fileType!: string;

  // Default attributes
  showingModal = false;
  exportType = FileExportTypes.Executive;
  description = FileExportDescriptions.Executive;
  FileExportTypes = FileExportTypes;

  // Configures outputData object's report type based on user input
  @Watch('exportType')
  onExportTypeChanged(newValue: FileExportTypes) {
    switch (newValue) {
      case FileExportTypes.Executive:
        this.description = FileExportDescriptions.Executive;
        break;
      case FileExportTypes.Manager:
        this.description = FileExportDescriptions.Manager;
        break;
      case FileExportTypes.Administrator:
        this.description = FileExportDescriptions.Administrator;
        break;
    }
  }

  // Invoked when file(s) are loaded.
  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
  }

  async exportHTML(): Promise<void> {
    if (this.filter.fromFile.length === 0) {
      return SnackbarModule.failure('No files have been loaded.');
    }

    const files = [];
    for (const fileId of this.filter.fromFile) {
      const file = InspecDataModule.allEvaluationFiles.find(
        (f) => f.uniqueId === fileId
      );
      if (file) {
        const data = file.evaluation;
        const fileName = file.filename;
        const fileID = file.uniqueId;
        files.push({data, fileName, fileID});
      }
    }

    // Generate and export HTML file
    const body = await new FromHDFToHTMLMapper(files, this.exportType).toHTML(
      '/static/export/'
    );
    saveAs(
      new Blob([s2ab(body)], {type: 'application/octet-stream'}),
      `${this.exportType}_Report_${new Date().toString()}.html`.replace(
        /[ :]/g,
        '_'
      )
    );

    this.closeModal();
  }
}
</script>
