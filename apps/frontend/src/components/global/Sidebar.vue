<template>
  <v-navigation-drawer
    :value="value"
    @input="$emit('input', $event)"
    :clipped="$vuetify.breakpoint.lgAndUp"
    app
    style="margin-top: 56px;"
    disable-resize-watcher
    fixed
    temporary
    width="375px"
  >
    <v-list dense class="px-2" subheader>
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
      <div v-else>
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
      </div>
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
      <div v-else>
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
      </div>
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
      <div v-else>
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
      </div>
      <v-subheader>Files</v-subheader>
      <v-expansion-panels flat="true" v-model="file_views">
        <v-expansion-panel>
          <div v-if="visible_evaluation_files.length > 0">
            <v-expansion-panel-header title="View controls' results">
              <v-list-item>Results</v-list-item>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <FileItem
                v-for="(file, i) in visible_evaluation_files"
                :key="i"
                :file="file"
              />
              <v-list-item
                @click="toggle_all_evaluations"
                title="Show all files' controls"
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
            <v-expansion-panel-header title="View controls' results">
              <v-list-item>Profiles</v-list-item>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <ProfileItem
                v-for="(file, i) in visible_profile_files"
                :key="i"
                :file="file"
              />
              <v-list-item
                @click="toggle_all_profiles"
                title="Show all files' controls"
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
    FilteredDataModule.set_toggled_files([]);
    FilteredDataModule.set_toggled_files(files);
  }

  // toggle the "select all" for profiles
  toggle_all_profiles(): void {
    if (this.all_toggled_profiles) {
      this.set_selected_files(this.selected_evaluations);
    } else {
      let files = InspecDataModule.allProfileFiles.map(v => v.unique_id);
      files.push(...this.selected_evaluations);
      this.set_selected_files(files);
    }
  }

  // check to see if all profiles is selected
  get all_toggled_profiles(): boolean {
    return (
      this.selected_profiles.length == InspecDataModule.allProfileFiles.length
    );
  }

  // toggle the "select all" for evaluations
  toggle_all_evaluations(): void {
    if (this.all_toggled_evaluation) {
      this.set_selected_files(this.selected_profiles);
    } else {
      let files = InspecDataModule.allEvaluationFiles.map(v => v.unique_id);
      files.push(...this.selected_profiles);
      this.set_selected_files(files);
    }
  }

  // check to see if all evalutions are selected
  get all_toggled_evaluation(): boolean {
    return (
      this.selected_evaluations.length ==
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
    let file_ids = [...FilteredDataModule.selected_file_ids];
    let files = InspecDataModule.allProfileFiles;

    // is there a better way to do this?
    for (let x = 0; x < files.length; x++)
      for (let y = 0; y < file_ids.length; y++)
        if (files[x].unique_id === file_ids[y]) {
          // remove profile file
          file_ids.splice(y, 1);
          y--;
        }
    return file_ids;
  }

  // get all the currently selected profiles
  get selected_profiles(): number[] {
    let file_ids = [...FilteredDataModule.selected_file_ids];
    let files = InspecDataModule.allEvaluationFiles;

    // is there a better way to do this?
    for (let x = 0; x < files.length; x++)
      for (let y = 0; y < file_ids.length; y++)
        if (files[x].unique_id === file_ids[y]) {
          // remove evalation file
          file_ids.splice(y, 1);
          y--;
        }
    return file_ids;
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
