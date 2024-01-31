<template>
  <v-navigation-drawer :value="value" :clipped="$vuetify.breakpoint.lgAndUp" app
    :style="{'margin-top': classification ? '5em' : '3.5em', 'z-index': 11}" disable-resize-watcher
    disable-route-watcher fixed temporary width="600px" @input="$emit('input', $event)">
    <!--    @blur="value = false"
-->
    <v-expansion-panels v-model="active_path" accordion>
      <!-- heimdall lite view -->
        <DropdownContent
        v-if="!serverMode"
        header-text="Results"
        :files="visible_evaluation_files"
        :all-selected="all_evaluations_selected"
        :any-selected="any_evaluation_selected"
        :enable-compare-view="true"
        :compare-view-active="compareViewActive"
        @remove-selected="removeSelectedEvaluations"
        @toggle-all="toggle_all_evaluations"
        @toggle-compare-view="compareView"
        @changed-files="$emit('changed-files')"
      />
      <DropdownContent
        header-text="Profiles"
        v-if="!serverMode"
        :files="visible_profile_files"
        :all-selected="all_profiles_selected"
        :any-selected="any_profile_selected"
        @remove-selected="removeSelectedProfiles"
        @toggle-all="toggle_all_profiles"
        @changed-files="$emit('changed-files')" />
      <!-- Product View -->
      <ProductDropdownContent
        v-if="serverMode"
        header-text="Product: Results" :files="visible_evaluation_files"
        :all-selected="all_evaluations_selected"
        :enable-compare-view="true"
        :compare-view-active="compareViewActive"
        @toggle-all="toggle_all_evaluations"
        @toggle-compare-view="compareView"
        @changed-files="$emit('changed-files')" />
      <div style="width: 100%">
        <br>
      <v-btn
        id="boe-btn"
        :disabled="showBoeModal"
        class="primary"
        style="width: 100%"
        @click="show_boe_modal"
      >
        <span class="d-md-inline" style="display: inline !important;"> Download Authorization Artifacts </span>
      </v-btn>
      </div>
      <DownloadAuthorizationArtifactModal
        :visible="showBoeModal"
        :headers="headers"
        :files="listFiles"
        @close-modal="close_boe_modal"
      />
      <ProjectButton />
    </v-expansion-panels>
  </v-navigation-drawer>
</template>

<script lang="ts">
import DropdownContent from '@/components/global/sidebaritems/DropdownContent.vue';
import ProductDropdownContent from '@/components/global/sidebaritems/ProductDropdownContent.vue';
import {Trinary} from '@/enums/Trinary';
import RouteMixin from '@/mixins/RouteMixin';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationFile,ProfileFile} from '@/store/report_intake';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {ServerModule} from '../../store/server';
import {EvaluationModule} from '@/store/evaluations';
import _ from 'lodash';
import {ProductModuleState} from '../../store/product_module_state';
import ProjectButton from '@/components/generic/ProjectButton.vue';
import ServerMixin from '../../mixins/ServerMixin';
import DownloadAuthorizationArtifactModal from '@/components/global/DownloadAuthorizationArtifactModal.vue'
import S3 from 'aws-sdk/clients/s3';
import {s3ListFiles} from '@/utilities/aws_util';

@Component({
  components: {
    DropdownContent,
    DownloadAuthorizationArtifactModal,
    ProductDropdownContent,
    ProjectButton
  }
})
export default class Sidebar extends mixins(RouteMixin, ServerMixin) {
  @Prop({type: Boolean}) readonly value!: boolean;
  showBoeModal = false;
  s3Files: S3.Object[] = [];

  headers: Object[] = [
              {
                text: 'File',
                align: 'start',
                sortable: true,
                value: 'Key'
              },
              {
                text: 'Size',
                sortable: true,
                value: 'Size'
              },
              {
                text: 'Date',
                value: 'LastModified',
                sortable: true
              },
              {
                text: 'Download',
                value: 'Download',
                sortable: true
              }
          ];

  close_boe_modal() {
    this.showBoeModal = false;
  }

  show_boe_modal() {
    this.showBoeModal = true;
  }

  get listFiles() {
    return this.s3Files;
  }

  async getAuthArtiS3Files() {
    s3ListFiles(ProductModuleState.s3Prefix).then((response) => {
      if(response.data?.Contents?.length > 0)
      {
        this.s3Files = response.data.Contents;
      }
    }, (error) => {
      console.log(error);
    });
  }


  // open the appropriate v-expansion-panel based on current route
  get active_path() {
    if (this.current_route === 'profiles') {
      return 1;
    } else if (
      this.current_route === 'certifier' ||
      this.current_route === 'developer' ||
      this.current_route === 'cyber' ||
      this.current_route === 'results' ||
      this.current_route === 'compare'
    ) {
      return 0;
    } else {
      return -1;
    }
  }

  set active_path(id: number) {
    // There are currently 2 available values that the v-modal can have,
    // 0 -> results view
    // 1 -> profile view
    if (id === 0) {
      this.navigateWithNoErrors(`/results`);
    } else if (id === 1) {
      this.navigateWithNoErrors(`/profiles`);
    }
  }

  mounted() {
    FilteredDataModule.CLEAR_ALL_EVALUATIONS;
    this.getAuthArtiS3Files();
  }

  // get all visible (uploaded) evaluation files
  get visible_evaluation_files(): EvaluationFile[] {
    const files = InspecDataModule.allEvaluationFiles;
    return files.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  // get all visible (uploaded) profile files
  get visible_profile_files(): ProfileFile[] {
    const files = InspecDataModule.allProfileFiles;
    return files.sort((a, b) => a.filename.localeCompare(b.filename));
  }

  get all_evaluations_selected(): Trinary {
    return FilteredDataModule.all_evaluations_selected;
  }

  get any_evaluation_selected(): boolean {
    return FilteredDataModule.any_evaluation_selected;
  }

  get all_profiles_selected(): Trinary {
    return FilteredDataModule.all_profiles_selected;
  }

  get any_profile_selected(): boolean {
    return FilteredDataModule.any_profile_selected;
  }

  get compareViewActive(): boolean {
    return this.current_route === 'compare';
  }

  get classification(): string {
    return ServerModule.classificationBannerText;
  }

  // toggle the "select all" for profiles
  toggle_all_profiles(): void {
    FilteredDataModule.toggle_all_profiles();
  }

  // toggle the "select all" for evaluations
  toggle_all_evaluations(): void {
    FilteredDataModule.toggle_all_evaluations();
  }

  // toggle between the comparison view and the results view
  compareView(): void {
    if (this.current_route === 'results') {
      this.navigateWithNoErrors('/compare');
    }
    if (this.current_route === 'compare') {
      this.navigateWithNoErrors('/results');
    }
  }

  removeSelectedEvaluations(): void {
    const selectedFiles = FilteredDataModule.selected_evaluation_ids;
    selectedFiles.forEach((fileId) => {
      EvaluationModule.removeEvaluation(fileId);
      InspecDataModule.removeFile(fileId);
      // Remove any database files that may have been in the URL
      // by calling the router and causing it to write the appropriate
      // route to the URL bar
      this.navigateWithNoErrors(`/${this.current_route}`);
    });
  }

  removeSelectedProfiles(): void {
    const selectedFiles = FilteredDataModule.selected_profile_ids;
    selectedFiles.forEach((fileId) => {
      EvaluationModule.removeEvaluation(fileId);
      InspecDataModule.removeFile(fileId);
      // Remove any database files that may have been in the URL
      // by calling the router and causing it to write the appropriate
      // route to the URL bar
      this.navigateWithNoErrors(`/${this.current_route}`);
    });
  }
}
</script>

<style scoped>
nav.v-navigation-drawer {
  /* Need !important as a max-height derived from the footer being always
     visible is applied directly to element by vuetify */
  max-height: 100vh !important;
  /* z-index hides behind footer and topbar */
  z-index: 1;
}
</style>
