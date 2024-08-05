<template>
  <Base title="SBOM View" @changed-files="evalInfo = null">
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
      :class="$vuetify.breakpoint.xs ? 'overtake-bar mx-2' : 'regular-bar mx-2'"
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
        <v-container id="fileCards" mx-0 px-0 fluid>
          <!-- Evaluation Info -->
          <v-row no-gutters class="mx-n3 mb-3">
            <v-col>
              <v-slide-group v-model="evalInfo" show-arrows>
                <v-slide-item v-for="(file, i) in activeFiles" :key="i">
                  <v-card
                    width="100%"
                    max-width="100%"
                    class="mx-3"
                    data-cy="profileInfo"
                    @click="toggle_profile(file)"
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
          <ProfileData
            v-if="evalInfo != null"
            class="my-4 mx-2"
            :file="evalInfo"
          />
        </v-container>

        <!-- DataTable -->
        <v-row>
          <v-col xs-12>
            <v-card elevation="2">
              <ComponentTable
                :filter="all_filter"
                :component-ref="$route.params.componentRef"
                :searchTerm="searchTerm"
              />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </Base>
</template>

<script lang="ts">
import ComponentTable from '@/components/cards/sbomview/ComponentTable.vue';
import EvaluationInfo from '@/components/cards/EvaluationInfo.vue';
import UploadButton from '@/components/generic/UploadButton.vue';
import ExportJson from '@/components/global/ExportJson.vue';
import PrintButton from '@/components/global/PrintButton.vue';
import RouteMixin from '@/mixins/RouteMixin';
import {
  ExtendedControlStatus,
  Filter,
  FilteredDataModule,
  TreeMapState
} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {
  EvaluationFile,
  FileID,
  ProfileFile,
  SourcedContextualizedEvaluation,
  SourcedContextualizedProfile
} from '@/store/report_intake';
import {SearchModule} from '@/store/search';
import {ServerModule} from '@/store/server';
import Base from '@/views/Base.vue';
import {IEvaluation} from '@heimdall/interfaces';
import {Severity} from 'inspecjs';
import Component, {mixins} from 'vue-class-component';
import ServerMixin from '../mixins/ServerMixin';
import {EvaluationModule} from '../store/evaluations';
import {StatusCountModule} from '../store/status_counts';
import {compare_times} from '../utilities/delta_util';

@Component({
  components: {
    Base,
    ComponentTable,
    ExportJson,
    PrintButton,
    EvaluationInfo,
    UploadButton
  }
})
export default class Components extends mixins(RouteMixin, ServerMixin) {
  /**
   * The current state of the treemap as modeled by the treemap (duh).
   * Once can reliably expect that if a "deep" selection is not null, then its parent should also be not-null.
   */
  treeFilters: TreeMapState = [];
  controlSelection: string | null = null;

  gotStatus: boolean = false;
  gotSeverity: boolean = false;
  searchTerm: string = '';

  /** Model for if all-filtered snackbar should be showing */
  filterSnackbar = false;

  evalInfo:
    | SourcedContextualizedEvaluation
    | SourcedContextualizedProfile
    | null = null;

  /**
   * The currently selected file, if one exists.
   * Controlled by router.
   */
  get file_filter(): FileID[] {
    return FilteredDataModule.selectedProfileIds; // TODO: Update this to call a new function to get only the SBOM evaluations profiles
  }

  get evaluationFiles(): SourcedContextualizedEvaluation[] {
    return Array.from(FilteredDataModule.evaluations(this.file_filter)).sort(
      compare_times
    );
  }

  get activeFiles(): SourcedContextualizedEvaluation[] {
    return this.evaluationFiles;
  }

  getFile(fileID: FileID) {
    return InspecDataModule.allFiles.find((f) => f.uniqueId === fileID);
  }

  getDbFile(file: EvaluationFile | ProfileFile): IEvaluation | undefined {
    return EvaluationModule.evaluationForFile(file);
  }

  // Returns true if no files are uploaded
  get no_files(): boolean {
    return InspecDataModule.allFiles.length === 0;
  }

  /**
   * The filter for charts. Contains all of our filter stuff
   */
  get all_filter(): Filter {
    return {
      status: SearchModule.statusFilter,
      severity: SearchModule.severityFilter,
      fromFile: this.file_filter,
      ids: SearchModule.controlIdSearchTerms,
      titleSearchTerms: SearchModule.titleSearchTerms,
      descriptionSearchTerms: SearchModule.descriptionSearchTerms,
      nistIdFilter: SearchModule.NISTIdFilter,
      searchTerm: SearchModule.freeSearch || '',
      codeSearchTerms: SearchModule.codeSearchTerms,
      tagFilter: SearchModule.tagFilter,
      treeFilters: this.treeFilters,
      omit_overlayed_controls: true,
      control_id: this.controlSelection || undefined
    };
  }

  /**
   * The filter for treemap. Omits its own stuff
   */
  get treemap_full_filter(): Filter {
    return {
      status: SearchModule.statusFilter || [],
      severity: SearchModule.severityFilter,
      titleSearchTerms: SearchModule.titleSearchTerms,
      descriptionSearchTerms: SearchModule.descriptionSearchTerms,
      codeSearchTerms: SearchModule.codeSearchTerms,
      tagFilter: SearchModule.tagFilter,
      nistIdFilter: SearchModule.NISTIdFilter,
      ids: SearchModule.controlIdSearchTerms,
      fromFile: this.file_filter,
      searchTerm: SearchModule.freeSearch,
      omit_overlayed_controls: true
    };
  }

  /**
   * Clear all filters
   */
  clear(clearSearchBar = false) {
    SearchModule.clear();
    this.filterSnackbar = false;
    this.controlSelection = null;
    this.treeFilters = [];
    if (clearSearchBar) {
      this.searchTerm = '';
    }
  }

  /**
   * Returns true if we can currently clear.
   * Essentially, just controls whether the button is available
   */
  get can_clear(): boolean {
    // Return if any params not null/empty
    let result: boolean;
    if (
      SearchModule.severityFilter.length !== 0 ||
      SearchModule.statusFilter.length !== 0 ||
      SearchModule.controlIdSearchTerms.length !== 0 ||
      SearchModule.codeSearchTerms.length !== 0 ||
      SearchModule.tagFilter.length !== 0 ||
      this.searchTerm ||
      this.treeFilters.length
    ) {
      result = true;
    } else {
      result = false;
    }

    // Logic to check: are any files actually visible?
    if (FilteredDataModule.controls(this.all_filter).length === 0) {
      this.filterSnackbar = true;
    } else {
      this.filterSnackbar = false;
    }

    // Finally, return our result
    return result;
  }

  get waivedProfilesExist(): boolean {
    return StatusCountModule.countOf(this.all_filter, 'Waived') >= 1;
  }

  //changes width of eval info if it is in server mode and needs more room for tags
  get info_width(): number {
    if (ServerModule.serverMode) {
      return 500;
    }
    return 300;
  }

  //basically a v-model for the eval info cards when there is no slide group
  toggle_profile(
    file: SourcedContextualizedEvaluation | SourcedContextualizedProfile
  ) {
    if (file === this.evalInfo) {
      this.evalInfo = null;
    } else {
      this.evalInfo = file;
    }
  }

  showErrors() {
    this.searchTerm = 'status:"Profile Error"';
  }

  showWaived() {
    this.searchTerm = 'status:"Waived"';
  }

  showSeverityOverrides() {
    this.searchTerm = 'tags:"severityoverride"';
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
