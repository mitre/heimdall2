<template>
  <v-expansion-panel @change="redirect">
    <v-expansion-panel-header :title="text">
      <v-list-item>{{ text }}</v-list-item>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <div v-if="files.length > 0">
        <FileList v-for="(file, i) in files" :key="i" :file="file" />
        <div v-if="text === 'Results'">
          <v-list-item>
            <v-list-item-action @click="compareView">
              <v-checkbox color="blue" :input-value="selected" />
            </v-list-item-action>

            <v-list-item-avatar>
              <v-icon small>mdi-triangle-outline</v-icon>
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>Comparison</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </div>
        <div v-if="text === 'Profiles'">
          <v-list-item :title="toggle" @click="toggle_all_profiles">
            <v-list-item-avatar>
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                <div v-if="all_toggled_profiles">Deselect all {{ text }}</div>
                <div v-else>Select all {{ text }}</div>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </div>
        <div v-else-if="text === 'Results'">
          <v-list-item :title="toggle" @click="toggle_all_evaluations">
            <v-list-item-avatar>
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                <div v-if="all_toggled_evaluations">
                  Deselect all {{ text }}
                </div>
                <div v-else>Select all {{ text }}</div>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </div>
      </div>
      <div v-else>No {{ text }} are currently loaded.</div>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import {Vue, Component, Prop} from 'vue-property-decorator';
import FileList from '@/components/global/sidebaritems/SidebarFileList.vue';
import {InspecDataModule} from '@/store/data_store';
import {FilteredDataModule} from '@/store/data_filters';

@Component({
  components: {
    FileList
  }
})
export default class DropdownContent extends Vue {
  @Prop({type: String, required: true}) readonly text!: string;
  @Prop({type: String, required: true}) readonly toggle!: string;
  @Prop({type: Array, required: true}) readonly files!: Object[];
  @Prop({type: String, required: true}) readonly route!: string;

  redirect(): void {
    if (this.route !== this.$router.currentRoute.path)
      this.$router.push({path: this.route});
  }

  // toggle the "select all" for profiles
  toggle_all_profiles(): void {
    if (this.all_toggled_profiles) {
      FilteredDataModule.set_toggled_files(
        FilteredDataModule.selected_evaluations
      );
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
    if (this.all_toggled_evaluations) {
      FilteredDataModule.set_toggled_files(
        FilteredDataModule.selected_profiles
      );
    } else {
      let files = InspecDataModule.allEvaluationFiles.map(v => v.unique_id);
      files.push(...FilteredDataModule.selected_profiles);
      FilteredDataModule.set_toggled_files(files);
    }
  }

  // check to see if all evalutions are selected
  get all_toggled_evaluations(): boolean {
    return (
      FilteredDataModule.selected_evaluations.length ==
      InspecDataModule.allEvaluationFiles.length
    );
  }

  // toggle between the comparison view and the results view
  compareView(): void {
    if (this.$router.currentRoute.path === '/results')
      this.$router.push({path: '/compare'});
    if (this.$router.currentRoute.path === '/compare')
      this.$router.push({path: '/results'});
  }

  /** toggle the checkbox associated with the toggling between
   the comparison view and results view */
  get selected(): boolean {
    let flag = false;
    if (this.$router.currentRoute.path === '/results') flag = false;
    if (this.$router.currentRoute.path === '/compare') flag = true;

    return flag;
  }
}
</script>
