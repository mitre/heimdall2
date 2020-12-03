<template>
  <v-expansion-panel>
    <v-expansion-panel-header :title="headerText">
      {{ headerText }}
    </v-expansion-panel-header>
    <v-expansion-panel-content v-if="files.length > 0">
      <v-list>
        <FileList v-for="(file, i) in files" :key="i" :file="file" />

        <v-list-item
          :title="`${selectAllText} all ${headerText.toLowerCase()}`"
          @click.stop="$emit('toggle-all')"
        >
          <v-list-item-action>
            <v-checkbox
              color="blue"
              :indeterminate="isIndeterminate"
              :input-value="allSelectedValue"
            />
          </v-list-item-action>
          <v-list-item-avatar>
            <v-icon small>mdi-format-list-bulleted</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              <div>{{ selectAllText }} all {{ headerText.toLowerCase() }}</div>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-divider v-if="enableCompareView" />

        <v-list-item
          v-if="enableCompareView"
          :title="`Comparison View: ${
            compareViewActive ? 'enabled' : 'disabled'
          }`"
          @click.stop="$emit('toggle-compare-view')"
        >
          <v-list-item-action>
            <v-switch color="blue" :input-value="compareViewActive" />
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Comparison View</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-expansion-panel-content>
    <v-expansion-panel-content v-else>
      No {{ headerText.toLowerCase() }} are currently loaded.
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script lang="ts">
import {Vue, Component, Prop} from 'vue-property-decorator';
import FileList from '@/components/global/sidebaritems/SidebarFileList.vue';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {Trinary} from '@/enums/Trinary.ts';

@Component({
  components: {
    FileList
  }
})
export default class DropdownContent extends Vue {
  @Prop({type: String, required: true}) readonly headerText!: string;
  @Prop({type: String, required: true}) readonly allSelected!: Trinary;
  @Prop({type: Array, required: true}) readonly files!:
    | EvaluationFile[]
    | ProfileFile[];
  @Prop({type: String, required: false}) readonly route!: string;
  @Prop({default: false, type: Boolean, required: false})
  readonly compareViewActive!: boolean;
  @Prop({default: false, type: Boolean, required: false})
  readonly enableCompareView!: boolean;

  get allSelectedValue(): boolean {
    return this.allSelected === Trinary.On;
  }

  get isIndeterminate(): boolean {
    return this.allSelected === Trinary.Mixed;
  }

  get selectAllText(): string {
    return this.allSelected === Trinary.On ? 'Deselect' : 'Select';
  }
}
</script>
