<template>
  <v-card>
    <v-card-title>
      Profiles
    </v-card-title>
    <v-row class="pa-4" justify="space-between">
      <v-col cols="5">
        <v-treeview
          :items="items"
          :active.sync="active"
          hoverable
          open-all
          dense
          activatable
          color="info"
          selection-type="independent"
          transition
        >
          <template v-slot:prepend="{ item, active }">
            <v-icon>mdi-note</v-icon>
          </template>
        </v-treeview>
      </v-col>

      <v-divider vertical></v-divider>

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
            <v-card-text>
              <h3 class="headline mb-2">
                {{ selected.name }}
              </h3>
              <div class="mb-2">{{ selected.data.title }}</div>
            </v-card-text>
            <v-divider></v-divider>
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
import Vue from "vue";
import Component from "vue-class-component";
import InspecDataModule, {
  ContextualizedExecution,
  ContextualizedProfile
} from "@/store/data_store";
import StatusCountModule from "@/store/status_counts";
import { getModule } from "vuex-module-decorators";
import FilteredDataModule, { Filter } from "../../store/data_filters";
import { profile_unique_key } from "../../utilities/format_util";
import { InspecFile, ProfileFile } from "../../store/report_intake";

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

  constructor(profile: ContextualizedProfile) {
    // Base information
    this.id = profile_unique_key(profile);
    this.name = profile.data.name;
    this.children = profile.extended_by.map(p => new TreeItem(p));
  }
}

// We declare the props separately
// to make props types inferrable.
const Props = Vue.extend({
  props: {
    filter: Object // Of type Filer from filteredData
  }
});

@Component({
  components: {}
})
export default class ProfileData extends Props {
  /** Models selected item ids */
  active: string[] = [];

  /** Models all loaded profiles */
  get items(): TreeItem[] {
    return this.root_profiles.map(p => new TreeItem(p));
  }

  /** Flat representation of all profiles that ought to be visible  */
  get visible_profiles(): Readonly<ContextualizedProfile[]> {
    // Get all profiles
    let store = getModule(InspecDataModule, this.$store);
    let profiles: Readonly<ContextualizedProfile[]> = store.contextualProfiles;
    let filter = this.filter as Filter;
    if (filter.fromFile !== undefined) {
      let filtered = getModule(FilteredDataModule, this.$store);
      profiles = filtered.profiles(filter.fromFile);
    }
    return profiles;
  }

  /** Strips visible profiles down to those that are not extended from any others. The "Top" profiles */
  get root_profiles(): ContextualizedProfile[] {
    // Strip to roots
    let profiles = this.visible_profiles.filter(
      p => p.extends_from.length === 0
    );
    return profiles;
  }

  /** Get the most recently selected */
  get selected(): ContextualizedProfile | undefined {
    // If no active, then who cares
    if (!this.active.length) return undefined;

    // Otherwise take the most recent active
    const id = this.active[0];
    const selected_profile = this.visible_profiles.find(
      prof => profile_unique_key(prof) === id
    );
    return selected_profile;
  }

  get selected_info(): InfoItem[] {
    if (this.selected === undefined) {
      return [];
    }
    let output: InfoItem[] = [];

    output.push({
      label: "Version",
      text: (this.selected.data as any).version //Todo: fix
    });

    // Deduce filename, start time
    let from_file: InspecFile;
    let start_time: string | null;
    if (this.selected.from_execution) {
      let exec = this.selected.sourced_from as ContextualizedExecution;
      from_file = exec.sourced_from;
      let with_time = this.selected.contains.find(x => x.root.hdf.start_time);
      start_time = (with_time && with_time.root.hdf.start_time) || null;
    } else {
      from_file = this.selected.sourced_from as ProfileFile;
      start_time = null;
    }

    // And put the filename
    output.push({
      label: "From file",
      text: from_file.filename
    });

    if (start_time) {
      output.push({
        label: "Start time",
        text: start_time
      });
    }

    if (this.selected.data.sha256) {
      output.push({
        label: "Sha256 Hash",
        text: this.selected.data.sha256
      });
    }

    if (this.selected.data.title) {
      output.push({
        label: "Title",
        text: this.selected.data.title
      });
    }

    if (this.selected.data.maintainer) {
      output.push({
        label: "Maintainer",
        text: this.selected.data.maintainer
      });
    }

    if (this.selected.data.copyright) {
      output.push({
        label: "Copyright",
        text: this.selected.data.copyright
      });
    }

    if (this.selected.data.copyright_email) {
      output.push({
        label: "Copyright Email",
        text: this.selected.data.copyright_email
      });
    }

    output.push({
      label: "Controls",
      text: this.selected.data.controls.length.toString()
    });

    return output;
  }
}

interface InfoItem {
  label: string;
  text: string;
  info?: string;
}
</script>
