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
        <v-row>
          <v-col cols="1">
            <v-icon color="primary">mdi-information-variant-circle</v-icon>
          </v-col>
          <v-col>
            Both Manager and Administrator Reports can be data intensive, which
            can take longer for the browser to render the page.
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
import {SourcedContextualizedEvaluation} from '../../store/report_intake';

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

    document.body.style.cursor = 'wait';
    const files = [];
    const filteredStatus = this.filter.status!.toString() || '';
    const filteredSeverity = this.filter.severity!.toString() || '';

    for (const fileId of this.filter.fromFile) {
      const file = InspecDataModule.allEvaluationFiles.find(
        (f) => f.uniqueId === fileId
      );

      if (file) {
        const data = file.evaluation;
        const filteredControls = this.getFilterControlIds(
          data,
          filteredStatus,
          filteredSeverity
        );

        // Only show files that have controls that meet
        // the status/severity criteria, could be all files
        if (filteredControls.length > 0) {
          const fileName = file.filename;
          const fileID = file.uniqueId;
          files.push({data, fileName, fileID, filteredControls});
        }
      }
    }
    // Generate and export HTML file
    const body = await new FromHDFToHTMLMapper(files, this.exportType).toHTML();

    saveAs(
      new Blob([s2ab(body)], {type: 'application/octet-stream'}),
      `${this.exportType}_Report_${new Date().toString()}.html`.replace(
        /[ :]/g,
        '_'
      )
    );

    document.body.style.cursor = 'default';
    this.closeModal();
  }

  /**
   * Generate an array containing the control identification numbers
   * (profiles.controls) selected. The Id is extracted for the
   * profiles.controls.id, it can be CIS, STIG (V or SV), CWEID, WASCID,
   * or any other control Id.
   *
   * Possible selection permutations are:
   *   - Status (pass, failed, etc)
   *   - Severity ( low, medium, etc)
   *   - Combination of Status and Severity
   */
  getFilterControlIds(
    data: SourcedContextualizedEvaluation,
    status: string,
    severity: string
  ): string[] {
    /**
     * NOTE: The filterControls array is used to specify what controls
     * are selected based on Status and Severity selection.
     * If we use the approach of filtering the content from the data object
     * (e.g.
     *   data.data.profiles[0].controls =
     *     data.data.profiles[0].controls.filter((control) => {
     *       if (filteredControls.includes(control.id)) {
     *         return filteredControls.includes(control.id);
     *       }
     *     });
     * )
     * the contextualize object does not get updated and the results
     * in data_store get out of sync, there is, when utilizing the
     * ".contains" it returns the results object (child of the controls object)
     *  where the file.evaluations returns the filtered controls.
     */
    let filteredControls: string[] = [];
    // Both Status and Severity selection
    if (status.length > 0 && severity.length > 0) {
      data.contains.map((profile) => {
        profile.contains.map((result) => {
          if (
            status?.includes(result.root.hdf.status) &&
            severity?.includes(result.root.hdf.severity)
          ) {
            filteredControls.push(result.data.id);
          }
        });
      });
      // Status selection
    } else if (status.length > 0) {
      data.contains.map((profile) => {
        profile.contains.map((result) => {
          if (status?.includes(result.root.hdf.status)) {
            filteredControls.push(result.data.id);
          }
        });
      });
      // Severity selection
    } else if (severity.length > 0) {
      data.contains.map((profile) => {
        profile.contains.map((result) => {
          if (severity?.includes(result.root.hdf.severity)) {
            filteredControls.push(result.data.id);
          }
        });
      });
      // No selection
    } else {
      data.contains.map((profile) => {
        profile.contains.map((result) => {
          filteredControls.push(result.data.id);
        });
      });
    }
    return filteredControls;
  }
}
</script>
