<template>
  <Base :title="curr_title" @changed-files="currentSbomMetadata = null">
    <!-- Topbar content - give it a search bar -->
    <template #topbar-content>
      <v-text-field
        v-model="searchTerm"
        flat
        hide-details
        dense
        solo
        prepend-inner-icon="mdi-magnify"
        label="Search"
        clearable
        :class="
          $vuetify.breakpoint.xs ? 'overtake-bar mx-2' : 'regular-bar mx-2'
        "
        @click:clear="searchTerm = ''"
      />

      <UploadButton />
      <div class="text-center">
        <v-menu>
          <template #activator="{on, attrs}">
            <v-btn v-bind="attrs" class="mr-2" v-on="on">
              <span class="d-none d-md-inline mr-2"> Export </span>
              <v-icon> mdi-file-export </v-icon>
            </v-btn>
          </template>
          <v-list class="py-0">
            <v-list-item class="px-0">
              <ExportJson />
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
      <PrintButton />
    </template>

    <!-- The main content: cards, etc -->
    <template #main-content>
      <v-container fluid grid-list-md pt-0 pa-2>
        <v-container mx-0 px-0 fluid>
          <!-- SBOM Info -->
          <v-row no-gutters class="mx-n3 mb-3">
            <v-col>
              <v-slide-group v-model="currentSbomMetadata" show-arrows>
                <v-slide-item v-for="(file, i) in sbomFiles" :key="i">
                  <v-card
                    width="100%"
                    max-width="100%"
                    class="mx-3"
                    @click="toggle_sbom(file)"
                  >
                    <EvaluationInfo :file="file" />
                    <v-card-subtitle class="bottom-right">
                      File Info ↓
                    </v-card-subtitle>
                  </v-card>
                </v-slide-item>
              </v-slide-group>
            </v-col>
          </v-row>
          <v-card v-if="currentSbomMetadata !== null">
            <v-row class="pa-4 my-3" flex-direction="column">
              <v-col>
                <ComponentContent
                  :component="currentSbomMetadata.component"
                  :metadata="currentSbomMetadata"
                />
              </v-col>
            </v-row>
          </v-card>
        </v-container>

        <!-- DataTable -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <ComponentTable
                :component-ref="$route.params.componentRef"
                :search-term="searchTerm"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- No viewable files snackbar -->
    <v-snackbar
      :value="file_filter.length === 0"
      class="mt-11"
      style="z-index: 2"
      :timeout="-1"
      color="warning"
      top
    >
      <span v-if="no_files" class="subtitle-2">
        No files are currently loaded. Press the <strong>LOAD</strong>
        <v-icon class="mx-1"> mdi-cloud-upload</v-icon> button above to load
        some.
      </span>
      <span v-else class="subtitle-2">
        No files are currently enabled for viewing. Open the
        <v-icon class="mx-1">mdi-menu</v-icon> sidebar menu, and ensure that the
        file(s) you wish to view are
        <v-icon class="mx-1">mdi-checkbox-marked</v-icon> checked.
      </span>
    </v-snackbar>
  </Base>
</template>

<script lang="ts">
import ComponentTable from '@/components/cards/sbomview/ComponentTable.vue';
import EvaluationInfo from '@/components/cards/EvaluationInfo.vue';
import ProfileInfo from '@/components/cards/ProfileInfo.vue';
import UploadButton from '@/components/generic/UploadButton.vue';
import ExportJson from '@/components/global/ExportJson.vue';
import PrintButton from '@/components/global/PrintButton.vue';
import RouteMixin from '@/mixins/RouteMixin';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {
  EvaluationFile,
  FileID,
  ProfileFile,
  SourcedContextualizedEvaluation
} from '@/store/report_intake';
import Base from '@/views/Base.vue';
import {IEvaluation} from '@heimdall/interfaces';
import Component, {mixins} from 'vue-class-component';
import ServerMixin from '../mixins/ServerMixin';
import {EvaluationModule} from '../store/evaluations';
import {compare_times} from '../utilities/delta_util';
import ProfileData from '@/components/cards/ProfileData.vue';
import ComponentContent from '@/components/cards/sbomview/ComponentContent.vue';
import {getSbomMetadata, SBOMMetadata} from '@/utilities/sbom_util';

@Component({
  components: {
    Base,
    ComponentTable,
    ComponentContent,
    ExportJson,
    PrintButton,
    EvaluationInfo,
    UploadButton,
    ProfileInfo,
    ProfileData
  }
})
export default class Components extends mixins(RouteMixin, ServerMixin) {
  searchTerm: string = '';

  currentSbomMetadata: SBOMMetadata | null = null;

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID[] {
    return FilteredDataModule.selected_sbom_ids;
  }

  get sbomFiles(): SourcedContextualizedEvaluation[] {
    return Array.from(FilteredDataModule.sboms(this.file_filter)).sort(
      compare_times
    );
  }

  getFile(fileID: FileID) {
    return InspecDataModule.allFiles.find((f) => f.uniqueId === fileID);
  }

  getDbFile(file: EvaluationFile | ProfileFile): IEvaluation | undefined {
    return EvaluationModule.evaluationForFile(file);
  }

  // Returns true if no files are uploaded
  get no_files(): boolean {
    return InspecDataModule.allSbomFiles.length === 0;
  }

  /**
   * The title to override with
   */
  get curr_title(): string {
    let returnText = 'SBOM View';
    if (this.file_filter.length === 1) {
      const file = this.getFile(this.file_filter[0]);
      if (file) {
        const dbFile = this.getDbFile(file);
        returnText += ` (${dbFile?.filename || file.filename} selected)`;
      }
    } else {
      returnText += ` (${this.file_filter.length} SBOMs selected)`;
    }
    return returnText;
  }

  //basically a v-model for the eval info cards when there is no slide group
  toggle_sbom(file: SourcedContextualizedEvaluation) {
    const metadata = getSbomMetadata(file);
    if (metadata.ok && this.currentSbomMetadata !== metadata.value) {
      this.currentSbomMetadata = metadata.value;
    } else {
      this.currentSbomMetadata = null;
    }
  }
}
</script>

<style scoped>
.glow {
  box-shadow: 0px 0px 8px 6px #5a5;
}

.bottom-right {
  position: absolute;
  bottom: 0;
  right: 0;
}
</style>
