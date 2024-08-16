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
                <SbomFilterInfo v-model="filter" />
                <SbomSettingsSelector v-model="settings" />
              </v-tabs>

              <v-tabs-items v-model="tab">
                <v-tab-item key="componentTable">
                  <!-- List of all components -->
                  <ComponentTable
                    :component-ref="$route.params.componentRef"
                    :current-headers="settings.currentHeaders"
                    :filter="currentFilter"
                    @show-components-in-tree="showComponentsInTree"
                    @show-components-in-table="showComponentsInTable"
                  />
                </v-tab-item>
                <v-tab-item key="dependencyTree">
                  <!-- Show dependency relationships -->
                  <DependencyTree
                    v-if="sbomData.length === 1"
                    ref="dependencyTree"
                    :sbom-data="sbomData[0]"
                    :filter="currentFilter"
                    :filter-active="can_clear"
                    @show-components-in-table="showComponentsInTable"
                  />
                  <v-card v-if="sbomData.length > 1">
                    <v-card-title> Error! </v-card-title>
                    <v-card-text
                      >Too many SBOMs are enabled for viewing. Open the
                      <v-icon class="mx-1">mdi-menu</v-icon> sidebar menu, and
                      ensure that the only one SBOM file is
                      <v-icon class="mx-1">mdi-checkbox-marked</v-icon>
                      checked.</v-card-text
                    >
                  </v-card>
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
import {Ref} from 'vue-property-decorator';
import SbomFilterInfo from '@/components/cards/sbomview/SbomFilterInfo.vue';

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
    SbomSettingsSelector,
    SbomFilterInfo
  }
})
export default class Sbom extends mixins(RouteMixin, ServerMixin) {
  @Ref('dependencyTree') readonly dependencyTree!: DependencyTree;

  searchTerm: string = '';
  currentSbomMetadata: SBOMMetadata | null = null;
  tab: number = 0; // open to componentTable

  /** model for if all-filtered snackbar should be showing */
  filterSnackbar = false;

  filter: SBOMFilter = {
    'bom-refs': this.queryFilter || undefined,
    severity: [...severities],
    fromFile: FilteredDataModule.selected_sbom_ids
  };

  settings: SbomViewSettings = {
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

  get currentFilter(): SBOMFilter {
    return {
      ...this.filter,
      fromFile: this.file_filter,
      searchTerm: this.searchTerm
    };
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
    this.filter['bom-refs'] = bomRefs;
    this.currentSbomMetadata = null; // hide the SBOM info panel
  }

  showComponentsInTree(bomRefs: string[]) {
    this.tab = 1; // corresponds to dependencyTree
    this.filter['bom-refs'] = bomRefs;
    this.currentSbomMetadata = null; // hide the SBOM info panel
    if (this.dependencyTree) {
      this.dependencyTree.openToFilter();
    }
  }

  get can_clear(): boolean {
    let result = false;
    if (
      this.currentFilter.severity?.length !== severities.length ||
      this.currentFilter['bom-refs']?.length ||
      this.currentFilter.searchTerm
    ) {
      result = true;
    }

    // Logic to check: are any components actually visible?
    if (FilteredDataModule.components(this.currentFilter).length === 0) {
      this.filterSnackbar = true;
    } else {
      this.filterSnackbar = false;
    }

    return result;
  }

  clear() {
    this.filter.severity = [...severities];
    this.filter['bom-refs'] = undefined;
    this.searchTerm = '';
    this.filterSnackbar = false;
  }
}
</script>

<style scoped>
.bottom-right {
  position: absolute;
  bottom: 0;
  right: 0;
}
</style>
