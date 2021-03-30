<template>
  <v-card>
    <v-row class="pa-4" justify="space-between">
      <v-col md="3" cols="12">
        <v-card-text> Parent Profile </v-card-text>
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
          <template #prepend="{}">
            <v-icon>mdi-note</v-icon>
          </template>
        </v-treeview>
        <div v-if="children.length > 0">
          <v-card-text> Depends On These Profiles: </v-card-text>
          <!-- for the children of the root -->
          <v-treeview
            :items="children"
            :active="active"
            hoverable
            dense
            activatable
            color="info"
            selection-type="independent"
            transition
            @update:active="setActive"
          >
            <template #prepend="{}">
              <v-icon>mdi-note</v-icon>
            </template>
          </v-treeview>
        </div>
      </v-col>

      <v-divider vertical />

      <v-col class="text-center">
        <ProfileInfo :profile="selected" />
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {SourcedContextualizedEvaluation, SourcedContextualizedProfile} from '@/store/report_intake';

import {profile_unique_key} from '@/utilities/format_util';
import ProfileInfo from '@/components/cards/ProfileInfo.vue';
import {Prop, Watch} from 'vue-property-decorator';
import {ContextualizedProfile} from 'inspecjs/dist/context';
import {InspecDataModule} from '../../store/data_store';

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

  constructor(profile: SourcedContextualizedProfile) {
    // Base information
    this.id = profile_unique_key(profile);
    this.name = profile.data.name;
    this.children = profile.extends_from.map((p) => new TreeItem(p as SourcedContextualizedProfile));
  }
}

@Component({
  components: {
    ProfileInfo
  }
})
export default class ProfileData extends Vue {
  @Prop({type: Object, required: true})
  readonly file!: SourcedContextualizedEvaluation | SourcedContextualizedProfile;

  // auto select the root profile on file change
  @Watch('file')
  onFileChanged(_newValue: boolean, _oldValue: boolean) {
    this.setDefault();
  }

  // auto select the root profile on load
  mounted() {
    this.setDefault();
  }

  /** Models selected item ids */
  active: string[] = [];
  stopActivePropagation = false;
  /** Models all loaded profiles */
  get children(): TreeItem[] {
    return new TreeItem(this.file_root_profile).children;
  }

  get selected(): SourcedContextualizedProfile | undefined {
    return InspecDataModule.allProfiles.find(
      (p) => this.active.includes(profile_unique_key(p))
    );
  }

  get file_root_profile(): SourcedContextualizedProfile {
    let result: ContextualizedProfile | undefined;
    if(this.file.from_file.hasOwnProperty('evaluation')) {
      result = (this.file as SourcedContextualizedEvaluation).from_file.evaluation.contains.find(
        (p) => p.extended_by.length === 0
      );
    }
    return (result || this.file) as SourcedContextualizedProfile;
  }

  //the single root tree item
  get root_tree(): TreeItem[] {
    const tree = new TreeItem(this.file_root_profile);
    tree.children = [];
    return [tree];
  }

  // stopActivePropagation is to stop the two v-treeviews from infinitely toggling
  // between calling each others `update:active` methods.
  setActive(active: string[]) {
    if(this.stopActivePropagation) {
      this.stopActivePropagation = false;
    } else {
      // There are only 2 treeviews when the parent profile has children
      // Do not enable stopActivePropagagation when there are no children
      if(this.children.length > 0) {
        this.stopActivePropagation = true;
      }

      if(active.length === 0) {
        this.setDefault();
      } else {
        this.active = active;
      }
    }
  }

  setDefault() {
    this.active = [profile_unique_key(this.file_root_profile)];
  }
}
</script>
