<template>
  <v-navigation-drawer
    :value="value"
    :clipped="$vuetify.breakpoint.lgAndUp"
    app
    style="margin-top: 56px;"
    disable-resize-watcher
    fixed
    temporary
    width="375px"
    @input="$emit('input', $event)"
  >
    <v-list dense class="px-2" subheader>
      <!--v-subheader>Files</v-subheader>
      <FileItem v-for="(file, i) in visible_files" :key="i" :file="file" />
      <v-list-item title="Show all files' controls" @click="toggle_all">
        <v-list-item-avatar>
          <v-icon small>mdi-format-list-bulleted</v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title>
            <div v-if="all_toggled">Deselect all reports</div>
            <div v-else>Select all reports</div>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item-->
      <v-subheader>Views</v-subheader>
      <div v-if="visible_evaluation_files.length > 0">
        <v-list-item to="/results" title="View results">
          <v-list-item-avatar>
            <v-icon small>mdi-television-guide</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Results View
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div>
      <!--div v-else>
        <v-list-item :color="blue" title="View results">
          <v-list-item-avatar>
            <v-icon small>mdi-television-guide</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Results View
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div -->
      <div v-if="visible_evaluation_files.length > 0">
        <v-list-item to="/compare" title="Compare results">
          <v-list-item-avatar>
            <v-icon small>mdi-triangle-outline</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Results Comparison View
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div>
      <!-- div v-else>
        <v-list-item title="Compare results">
          <v-list-item-avatar>
            <v-icon small>mdi-triangle-outline</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Results Comparison View
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div -->
      <div v-if="visible_profile_files.length > 0">
        <v-list-item to="/profiles" title="View profiles">
          <v-list-item-avatar>
            <v-icon small>mdi-television-guide</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Profiles View
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div>
      <!-- div v-else>
        <v-list-item title="View profiles">
          <v-list-item-avatar>
            <v-icon small>mdi-television-guide</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              Profiles View
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </div -->
      <v-subheader>Files</v-subheader>
      <v-expansion-panels v-model="file_views" flat="true">
        <v-expansion-panel>
          <div v-if="visible_evaluation_files.length > 0">
            <v-expansion-panel-header title="Results">
              <v-list-item>Results</v-list-item>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <FileItem
                v-for="(file, i) in visible_evaluation_files"
                :key="i"
                :file="file"
              />
              <v-list-item
                title="Toggle selection on all results"
                @click="toggle_all_evaluations"
              >
                <v-list-item-avatar>
                  <v-icon small>mdi-format-list-bulleted</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    <div v-if="all_toggled_evaluation">
                      Deselect all results set
                    </div>
                    <div v-else>Select all results set</div>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-expansion-panel-content>
          </div>
        </v-expansion-panel>
        <v-expansion-panel>
          <div v-if="visible_profile_files.length > 0">
            <v-expansion-panel-header title="Profiles">
              <v-list-item>Profiles</v-list-item>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <ProfileItem
                v-for="(file, i) in visible_profile_files"
                :key="i"
                :file="file"
              />
              <v-list-item
                title="Toggle selection of all profiles"
                @click="toggle_all_profiles"
              >
                <v-list-item-avatar>
                  <v-icon small>mdi-format-list-bulleted</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    <div v-if="all_toggled_profiles">Deselect all profiles</div>
                    <div v-else>Select all profiles</div>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-expansion-panel-content>
          </div>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-list>
    <v-list dense class="px-2" subheader>
      <v-subheader>Tools</v-subheader>
      <slot></slot>
    </v-list>
    <v-list dense class="px-2" subheader>
      <v-subheader>Info</v-subheader>
      <AboutModal>
        <template v-slot:clickable="{on}">
          <LinkItem key="about" text="About" icon="mdi-information" v-on="on" />
        </template>
      </AboutModal>
      <HelpModal>
        <template v-slot:clickable="{on}">
          <LinkItem key="help" text="Help" icon="mdi-help-circle" v-on="on" />
        </template>
      </HelpModal>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {InspecDataModule} from '@/store/data_store';
import FileItem from '@/components/global/sidebaritems/SidebarFile.vue';
import ProfileItem from '@/components/global/sidebaritems/SidebarProfile.vue';
import LinkItem from '@/components/global/sidebaritems/SidebarLink.vue';
import AboutModal from '@/components/global/AboutModal.vue';
import HelpModal from '@/components/global/HelpModal.vue';
import {FilteredDataModule} from '../../store/data_filters';

// We declare the props separately to make props types inferable.
const SidebarProps = Vue.extend({
  props: {
    value: Boolean // Whether or not this item should make itself visible
  }
});

@Component({
  components: {
    LinkItem,
    FileItem,
    ProfileItem,
    AboutModal,
    HelpModal
  }
})
export default class Sidebar extends SidebarProps {
  // used to toggle v-exapansion-panel
  file_views = 0;

  created() {
    // open the appropriate v-expansion-panel based on current route
    if (this.curr_route_path == '/results') this.file_views = 0;
    else if (this.curr_route_path == '/compare') this.file_views = 0;
    else if (this.curr_route_path == '/profiles') this.file_views = 1;
  }

  // select the specified files
  set_selected_files(files: number[]): void {
    FilteredDataModule.set_toggled_files(files);
  }

  // toggle the "select all" for profiles
  toggle_all_profiles(): void {
    if (this.all_toggled_profiles) {
      let files = [];
      files.push(FilteredDataModule.selected_evaluations);
      FilteredDataModule.set_toggled_files(files);
    } else {
      let files = InspecDataModule.allProfileFiles.map(v => v.unique_id);
      files.push(...FilteredDataModule.selected_evaluations);
      FilteredDataModule.set_toggled_files(files);
    }
  }

  // check to see if all profiles is selected
  get all_toggled_profiles(): boolean {
    return (
      FilteredDataModule.selected_profiles.length ==
      InspecDataModule.allProfileFiles.length
    );
  }

  // toggle the "select all" for evaluations
  toggle_all_evaluations(): void {
    if (this.all_toggled_evaluation) {
      this.set_selected_files(FilteredDataModule.selected_profiles);
    } else {
      let files = InspecDataModule.allEvaluationFiles.map(v => v.unique_id);
      files.push(...FilteredDataModule.selected_profiles);
      this.set_selected_files(files);
    }
  }

  // check to see if all evalutions are selected
  get all_toggled_evaluation(): boolean {
    return (
      FilteredDataModule.selected_evaluations.length ==
      InspecDataModule.allEvaluationFiles.length
    );
  }

  // get the value of the current route
  get curr_route_path() {
    return this.$router.currentRoute.path;
  }

  // get all visible (uploaded) evaluation files
  get visible_evaluation_files(): Array<EvaluationFile> {
    let files = InspecDataModule.allEvaluationFiles;
    files = files.sort((a, b) => a.filename.localeCompare(b.filename));
    return files;
  }

  // get all visible (uploaded) profile files
  get visible_profile_files(): Array<ProfileFile> {
    let files = InspecDataModule.allProfileFiles;
    files = files.sort((a, b) => a.filename.localeCompare(b.filename));
    return files;
  }

  // get all the currently selected evaluations
  get selected_evaluations(): number[] {
    return FilteredDataModule.selected_evaluations;
  }

  // get all the currently selected profiles
  get selected_profiles(): number[] {
    return FilteredDataModule.selected_profiles;
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
