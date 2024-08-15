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

      <v-btn :disabled="!can_clear" @click="clear">
        <span class="d-none d-md-inline pr-2"> Clear </span>
        <v-icon>mdi-filter-remove</v-icon>
      </v-btn>
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

    <!-- The main content: cards, table, tree, etc -->
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
                    @click="toggle_sbom(sbomData[i])"
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
                  @show-components-in-tree="showComponentsInTree"
                  @show-components-in-table="showComponentsInTable"
                />
              </v-col>
            </v-row>
          </v-card>
        </v-container>

        <!-- DataElements -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <v-tabs v-model="tab" height="75">
                <v-tab key="componentTable">Component Table</v-tab>
                <v-tab key="dependencyTree">Dependency Tree</v-tab>
                <v-spacer />
                <SbomSettingsSelector v-model="sbomSettings" />
              </v-tabs>

              <v-tabs-items v-model="tab">
                <v-tab-item key="componentTable">
                  <!-- List of all components -->
                  <ComponentTable
                    :component-ref="$route.params.componentRef"
                    :bom-ref-filter="bomRefFilter"
                    :current-headers="sbomSettings.currentHeaders"
                    :filter="all_filter"
                    @show-components-in-tree="showComponentsInTree"
                    @show-components-in-table="showComponentsInTable"
                  />
                </v-tab-item>
                <v-tab-item key="dependencyTree">
                  <!-- Show dependency relationships -->
                  <template v-for="(sbom, i) in sbomData">
                    <DependencyTree
                      :key="i"
                      :sbom-data="sbom"
                      :filter="all_filter"
                      :filter-active="can_clear"
                      @show-components-in-table="showComponentsInTable"
                    />
                  </template>
                </v-tab-item>
              </v-tabs-items>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- No viewable files snackbar -->
    <v-snackbar
      :value="filterSnackbar"
      class="mt-11"
      style="z-index: 2"
      :timeout="-1"
      color="warning"
      top
    >
      <span v-if="file_filter.length" class="subtitle-2">
        All results are filtered out. Use the
        <v-icon>mdi-filter-remove</v-icon> button in the top right to clear
        filters and show all.
      </span>
      <span v-else-if="no_files" class="subtitle-2">
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
import SbomSettingsSelector from '@/components/cards/sbomview/SbomSettingsSelector.vue';
import DependencyTree from '@/components/cards/sbomview/DependencyTree.vue';
import EvaluationInfo from '@/components/cards/EvaluationInfo.vue';
import ProfileInfo from '@/components/cards/ProfileInfo.vue';
import UploadButton from '@/components/generic/UploadButton.vue';
import ExportJson from '@/components/global/ExportJson.vue';
import PrintButton from '@/components/global/PrintButton.vue';
import RouteMixin from '@/mixins/RouteMixin';
import {FilteredDataModule, SBOMFilter} from '@/store/data_filters';
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
import {
  parseSbomPassthrough,
  SBOMData,
  SBOMMetadata,
  SbomViewSettings
} from '@/utilities/sbom_util';
import {severities} from 'inspecjs';

@Component({
  components: {
    Base,
    ComponentTable,
    DependencyTree,
    ComponentContent,
    ExportJson,
    PrintButton,
    EvaluationInfo,
    UploadButton,
    ProfileInfo,
    ProfileData,
    SbomSettingsSelector
  }
})
export default class Sbom extends mixins(RouteMixin, ServerMixin) {
  searchTerm: string = '';
  currentSbomMetadata: SBOMMetadata | null = null;
  tab: number = 0; // open to componentTable

  /** Model for if all-filtered snackbar should be showing */
  filterSnackbar = false;
  bomRefFilter: string[] | null = this.queryFilter;
  sbomSettings: SbomViewSettings = {
    severities: [...severities],
    currentHeaders: [
      'fileName',
      'name',
      'version',
      'group',
      'description',
      'affectingVulnerabilities',
      'treeView'
    ]
  };

  get queryFilter(): string[] | null {
    if (this.$route.query.componentRef) {
      if (Array.isArray(this.$route.query.componentRef)) {
        // remove all possibly null items
        return this.$route.query.componentRef.flatMap((ref) =>
          ref ? [ref] : []
        );
      }
      return [this.$route.query.componentRef];
    }
    return null;
  }

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

  get sbomData(): SBOMData[] {
    return this.sbomFiles.map(parseSbomPassthrough);
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
  toggle_sbom(sbom: SBOMData) {
    const metadata = sbom.metadata;
    if (metadata && this.currentSbomMetadata !== metadata) {
      this.currentSbomMetadata = metadata;
    } else {
      this.currentSbomMetadata = null;
    }
  }

  showComponentsInTable(bomRefs: string[]) {
    this.tab = 0; // corresponds to componentTable
    this.bomRefFilter = bomRefs;
    this.currentSbomMetadata = null; // hide the SBOM info panel
  }

  showComponentsInTree(bomRefs: string[]) {
    this.tab = 1; // corresponds to dependencyTree
    this.bomRefFilter = bomRefs;
    this.currentSbomMetadata = null; // hide the SBOM info panel
  }

  get all_filter(): SBOMFilter {
    return {
      fromFile: FilteredDataModule.selected_sbom_ids,
      severity: this.sbomSettings.severities,
      'bom-refs': this.bomRefFilter || undefined
    };
  }

  get can_clear(): boolean {
    let result = false;
    if (
      this.all_filter.severity?.length !== severities.length ||
      this.all_filter['bom-refs']?.length
    ) {
      result = true;
    }

    // Logic to check: are any files actually visible?
    if (FilteredDataModule.components(this.all_filter).length === 0) {
      this.filterSnackbar = true;
    } else {
      this.filterSnackbar = false;
    }

    return result;
  }

  clear() {
    this.sbomSettings.severities = [...severities];
    this.bomRefFilter = null;
    this.searchTerm = '';
    this.filterSnackbar = false;
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
