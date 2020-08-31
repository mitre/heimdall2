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
      <v-expansion-panels flat="true">
        <v-expansion-panel>
          <v-expansion-panel-header title="View controls' results">
            <div v-if="curr_route_path != '/results'">
              <v-list-item to="/results" title="View controls' results">
                <button @click="reset_selection">
                  Evaluations (click here to view)
                </button>
              </v-list-item>
            </div>
            <div v-else><v-list-item>Evaluations</v-list-item></div>
          </v-expansion-panel-header>
          <div v-if="curr_route_path == '/results'">
            <v-expansion-panel-content>
              <FileItem
                v-for="(file, i) in visible_evaluation_files"
                :key="i"
                :file="file"
              />
              <v-list-item @click="toggle_all" title="Show all files' controls">
                <v-list-item-avatar>
                  <v-icon small>mdi-format-list-bulleted</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    <div v-if="all_toggled">Deselect all reports</div>
                    <div v-else>Select all reports</div>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-expansion-panel-content>
          </div>
          <div v-else>
            <v-expansion-panel-content>
              Can not view Evaluations in this view
            </v-expansion-panel-content>
          </div>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header title="View controls' results">
            <div v-if="curr_route_path != '/profiles'">
              <v-list-item to="/profiles" title="View controls' results">
                <button @click="reset_selection">
                  Profiles (click here to view)
                </button>
              </v-list-item>
            </div>
            <div v-else><v-list-item>Profiles</v-list-item></div>
          </v-expansion-panel-header>
          <div v-if="curr_route_path == '/profiles'">
            <v-expansion-panel-content>
              <ProfileItem
                v-for="(file, i) in visible_profile_files"
                :key="i"
                :file="file"
              />
              <v-list-item @click="toggle_all" title="Show all files' controls">
                <v-list-item-avatar>
                  <v-icon small>mdi-format-list-bulleted</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    <div v-if="all_toggled">Deselect all profiles</div>
                    <div v-else>Select all profiles</div>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-expansion-panel-content>
          </div>
          <div v-else>
            <v-expansion-panel-content>
              Can not view Profiles in this view
            </v-expansion-panel-content>
          </div>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header title="Compare evaluations' controls">
            <div v-if="curr_route_path != '/compare'">
              <v-list-item to="/compare" title="Compare evaluations' controls">
                <button @click="reset_selection">
                  Results Comparison (click here to view)
                </button>
              </v-list-item>
            </div>
            <div v-else><v-list-item>Results Comparison</v-list-item></div>
          </v-expansion-panel-header>
          <div v-if="curr_route_path == '/compare'">
            <v-expansion-panel-content>
              <FileItem
                v-for="(file, i) in visible_evaluation_files"
                :key="i"
                :file="file"
              />
              <v-list-item @click="toggle_all" title="Show all files' controls">
                <v-list-item-avatar>
                  <v-icon small>mdi-format-list-bulleted</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    <div v-if="all_toggled">Deselect all reports</div>
                    <div v-else>Select all reports</div>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-expansion-panel-content>
          </div>
          <div v-else>
            <v-expansion-panel-content>
              Can not view Evaluations Comparison in this view
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
import {InspecFile, EvaluationFile, ProfileFile} from '@/store/report_intake';
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
  //selects/deselects all files. Will select all unless all are already selected
  toggle_all(): void {
    if (this.all_toggled) {
      FilteredDataModule.set_toggled_files([]);
    } else {
      this.reset_selection();
    }
  }

  reset_selection(): void {
    FilteredDataModule.set_toggled_files(
      InspecDataModule.allFiles.map(v => v.unique_id)
    );
  }

  //checks if all files are selected
  get all_toggled(): boolean {
    return (
      InspecDataModule.allFiles.length ==
      FilteredDataModule.selected_file_ids.length
    );
  }

  get curr_route_path() {
    return this.$router.currentRoute.path;
  }
  
  get visible_evaluation_files(): Array<EvaluationFile> {
    let files = InspecDataModule.allEvaluationFiles;
    files = files.sort((a, b) => a.filename.localeCompare(b.filename));
    return files;
  }

  get visible_profile_files(): Array<ProfileFile> {
    let files = InspecDataModule.allProfileFiles;
    files = files.sort((a, b) => a.filename.localeCompare(b.filename));
    return files;
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
