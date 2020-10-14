<template>
  <v-card :watcher="selected_watch">
    <v-row class="pa-4" justify="space-between">
      <v-col cols="3">
        <v-card-text>
          Parent Profile
        </v-card-text>
        <!-- literally of just the one root item -->
        <v-treeview
          :items="root_tree"
          :active="active"
          hoverable
          dense
          activatable
          color="info"
          selection-type="independent"
          transition
          @update:active="setActive"
        >
          <template>
            <v-icon>mdi-note</v-icon>
          </template>
        </v-treeview>
        <div v-if="items.length > 0">
          <v-card-text>
            Depends On These Profiles:
          </v-card-text>
          <!-- for the children of the root -->
          <v-treeview
            :items="items"
            :active="child_active"
            hoverable
            dense
            activatable
            color="info"
            selection-type="independent"
            transition
            @update:active="setChildActive"
          >
            <template>
              <v-icon>mdi-note</v-icon>
            </template>
          </v-treeview>
        </div>
      </v-col>

      <v-divider vertical />

      <v-col class="d-flex text-center">
        <v-scroll-y-transition mode="out-in">
          <div
            v-if="!selected"
            class="title grey--text text--lighten-1 font-weight-light"
            style="align-self: center;"
          >
            Select a Profile
          </div>
          <v-card v-else :key="selected.id" class="mx-auto" flat>
            <v-card-title>
              <h3>
                {{ selected.name }}
              </h3>
              <div class="mb-2">{{ selected.data.title }}</div>
            </v-card-title>
            <v-divider />
            <v-row class="text-left py-2" tag="v-card-text">
              <template v-for="info in selected_info">
                <v-col :key="info.label" tag="strong" md="4" sm="12">
                  {{ info.label }}:
                </v-col>
                <v-col :key="info.label + '_'" md="8" sm="12">
                  {{ info.text }}
                </v-col>
              </template>
            </v-row>
          </v-card>
        </v-scroll-y-transition>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {InspecDataModule, isFromProfileFile} from '@/store/data_store';
import {SourcedContextualizedEvaluation} from '@/store/report_intake';

import {profile_unique_key} from '../../utilities/format_util';
import {InspecFile, ProfileFile} from '@/store/report_intake';
import {context} from 'inspecjs';

/**
 * Makes a ContextualizedProfile work as a TreeView item
 * Note: We cannot just put our ContextualizedProfile in here because,
 * for reasons unknown, it will cause a horrendous recursion loop
 */
class TreeItem {
  /** The item's unique identifier */
  id: string;
  /** What to show on the treeview */
  name: string;
  /** The children on the treeview */
  children: TreeItem[];

  constructor(profile: context.ContextualizedProfile) {
    // Base information
    this.id = profile_unique_key(profile);
    this.name = profile.data.name;
    this.children = profile.extends_from.map(p => new TreeItem(p));
  }
}

// We declare the props separately
// to make props types inferrable.
const Props = Vue.extend({
  props: {
    selected_prof: {type: Object, required: true}
  }
});

@Component({
  components: {}
})
export default class ProfileData extends Props {
  //auto select the root prof
  mounted() {
    this.active = [profile_unique_key(this.selected_prof)];
  }

  //auto select the root prof when data changes
  get selected_watch(): string {
    this.active = [profile_unique_key(this.selected_prof)];
    return profile_unique_key(this.selected_prof);
  }

  /** Models selected item ids */
  active: string[] = [];
  child_active: string[] = [];
  /** Models all loaded profiles */
  get items(): TreeItem[] {
    let root_tree = new TreeItem(this.selected_prof);
    return root_tree.children;
  }

  /** Get the most recently selected */
  get selected(): context.ContextualizedProfile | undefined {
    if (this.true_active == undefined) {
      return this.selected_prof;
    }
    let selected_profile = InspecDataModule.contextualProfiles.find(
      p => profile_unique_key(p) == this.true_active
    );
    return selected_profile;
  }

  /** Produces the actual info data that is shown in the right box, based on the selected item */
  get selected_info(): InfoItem[] {
    if (this.selected === undefined) {
      return [];
    }
    let output: InfoItem[] = [];

    output.push({
      label: 'Version',
      text: (this.selected.data as any).version //Todo: fix
    });

    // Deduce filename, start time
    let from_file: InspecFile;
    let start_time: string | null;
    if (isFromProfileFile(this.selected)) {
      from_file = this.selected.from_file as ProfileFile;
      start_time = null;
    } else {
      let exec = (this.selected
        .sourced_from as unknown) as SourcedContextualizedEvaluation;
      from_file = exec.from_file;
      let with_time = this.selected.contains.find(x => x.root.hdf.start_time);
      start_time = (with_time && with_time.root.hdf.start_time) || null;
    }

    // And put the filename
    output.push({
      label: 'From file',
      text: from_file.filename
    });

    if (start_time) {
      output.push({
        label: 'Start time',
        text: start_time
      });
    }

    if (this.selected.data.sha256) {
      output.push({
        label: 'Sha256 Hash',
        text: this.selected.data.sha256
      });
    }

    if (this.selected.data.title) {
      output.push({
        label: 'Title',
        text: this.selected.data.title
      });
    }

    if (this.selected.data.maintainer) {
      output.push({
        label: 'Maintainer',
        text: this.selected.data.maintainer
      });
    }

    if (this.selected.data.copyright) {
      output.push({
        label: 'Copyright',
        text: this.selected.data.copyright
      });
    }

    if (this.selected.data.copyright_email) {
      output.push({
        label: 'Copyright Email',
        text: this.selected.data.copyright_email
      });
    }

    output.push({
      label: 'Controls',
      text: this.selected.data.controls.length.toString()
    });

    return output;
  }

  //the single root tree item
  get root_tree(): TreeItem[] {
    let tree = new TreeItem(this.selected_prof);
    tree.children = [];
    return [tree];
  }

  //acts as sort of v-model for root
  setActive(active: string[]) {
    if (active.length == 0) {
      //unselects root prof when looking at other prof bu does not let the user just unselect the root prof
      if (this.active.length != 1) {
        this.active = [];
      } else {
        this.active = [profile_unique_key(this.selected_prof)];
      }
    } else {
      //clears other synced array to make sure one prof is selected at a time
      if (this.child_active.length > 0) {
        this.child_active = [];
      }
      this.active = [active[0]];
    }
  }

  //acts as sort of v-model for children
  setChildActive(active: string[]) {
    if (active.length == 0) {
      this.child_active = [];
      //default to root prof when unselected
      this.active = [profile_unique_key(this.selected_prof)];
    } else {
      if (this.active.length > 0) {
        this.active = [];
      }
      this.child_active = [active[0]];
    }
  }

  //combines synced items
  get true_active(): string | undefined {
    return this.active[0] || this.child_active[0];
  }
}

interface InfoItem {
  label: string;
  text: string;
  info?: string;
}
</script>
