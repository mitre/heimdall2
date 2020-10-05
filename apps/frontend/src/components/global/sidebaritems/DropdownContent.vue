<template>
  <v-expansion-panel>
    <v-expansion-panel-header :title="text">
      <v-list-item>{{ text }}</v-list-item>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <div v-if="files.length > 0">
        <FileList v-for="(file, i) in files" :key="i" :file="file" />
        <div v-if="enableCompareView">
          <v-list-item
            :input-value="compareViewActive"
            @click="$emit('toggle-compare-view')"
          >
            <v-list-item-avatar>
              <v-icon small>mdi-triangle-outline</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>Comparison</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </div>
        <div>
          <v-list-item :title="toggle" @click="$emit('toggle-all')">
            <v-list-item-avatar>
              <v-icon small>mdi-format-list-bulleted</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                <div>{{ selectAllText }} all {{ text }}</div>
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
  @Prop({type: Boolean, required: true}) readonly allSelected!: boolean;
  @Prop({default: 'Toggle select all', type: String, required: false})
  readonly toggle!: string;
  @Prop({type: Array, required: true}) readonly files!: Object[];
  @Prop({type: String, required: false}) readonly route!: string;
  @Prop({default: false, type: Boolean, required: false})
  readonly compareViewActive!: boolean;
  @Prop({default: false, type: Boolean, required: false})
  readonly enableCompareView!: boolean;

  get selectAllText(): string {
    return this.allSelected ? 'Deselect' : 'Select';
  }
}
</script>
