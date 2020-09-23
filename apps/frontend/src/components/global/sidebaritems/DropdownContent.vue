<template>
  <v-expansion-panel @change="redirect">
    <v-expansion-panel-header :title="text">
      <v-list-item>{{ text }}</v-list-item>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <div v-if="files.length > 0">
        <FileList v-for="(file, i) in files" :key="i" :file="file" />
        <div v-if="showdeltaview === true">
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
        <div v-if="showtoggle === true">
          <v-list-item :title="toggle" @click="toggle_all">
            <v-list-item-avatar>
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                <div>Select / Deselect all {{ text }}</div>
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

@Component({
  components: {
    FileList
  }
})
export default class DropdownContent extends Vue {
  @Prop({type: String, required: true}) readonly text!: string;
  @Prop({default: 'Toggle select all', type: String, required: false})
  readonly toggle!: string;
  @Prop({type: Array, required: true}) readonly files!: Object[];
  @Prop({type: String, required: false}) readonly route!: string;
  @Prop({default: false, type: Boolean, required: false})
  readonly showdeltaview!: boolean;
  @Prop({default: false, type: Boolean, required: false})
  readonly openview!: boolean;
  @Prop({default: false, type: Boolean, required: false})
  readonly showtoggle!: boolean;

  redirect(): void {
    if (this.openview === true)
      if (this.route !== this.$router.currentRoute.path)
        this.$router.push({path: this.route});
  }

  toggle_all() {
    this.$emit('toggleAll');
  }

  // toggle between the comparison view and the results view
  compareView(): void {
    this.$emit('compare');
  }

  /** toggle the checkbox associated with the toggling between
   the comparison view and results view */
  get selected(): boolean {
    let flag = false;

    if (this.$router.currentRoute.path === '/compare') flag = true;
    else flag = false;

    return flag;
  }
}
</script>
