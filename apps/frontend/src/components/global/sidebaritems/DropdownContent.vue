<template>
  <v-expansion-panel>
    <v-expansion-panel-header :title="headerText">
      {{ headerText }}
    </v-expansion-panel-header>
    <v-expansion-panel-content v-if="files.length > 0">
      <v-list dense>
        <FileList
          v-for="(file, i) in files"
          :key="i"
          :file="file"
          @changed-files="$emit('changed-files')"
        />

        <v-list-item
          :title="`${selectAllText} all ${headerText.toLowerCase()}`"
          @change="$emit('changed-files')"
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
            <v-icon small>
              mdi-format-list-bulleted
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              <div>{{ selectAllText }} all {{ headerText.toLowerCase() }}</div>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-row
          class="pt-5 pb-5"
          justify="center"
        >
          <v-btn
            small
            style="cursor: pointer"
            :disabled="!anyItemSelected"
            @click="$emit('remove-selected')"
          >
            <span>Remove selected {{ headerText }} </span>
            <v-icon right>
              mdi-text-box-remove-outline
            </v-icon>
          </v-btn>
        </v-row>

        <v-divider v-if="enableCompareView" />

        <v-list-item
          v-if="enableCompareView"
          :title="`Comparison View: ${
            compareViewActive ? 'enabled' : 'disabled'
          }`"
          @click.stop="$emit('toggle-compare-view')"
        >
          <v-list-item-action>
            <v-switch
              color="blue"
              :input-value="compareViewActive"
            />
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
import { Component, Prop, Vue } from 'vue-property-decorator';
import FileList from '@/components/global/sidebaritems/SidebarFileList.vue';
import { Trinary } from '@/enums/Trinary';
import type { EvaluationFile, ProfileFile } from '@/store/report_intake';

@Component({ components: { FileList } })
export default class DropdownContent extends Vue {
  @Prop({ required: true, type: String }) readonly allSelected!: Trinary;
  @Prop({ default: false, required: false, type: Boolean })
  readonly anySelected!: boolean;

  @Prop({ default: false, required: false, type: Boolean })
  readonly compareViewActive!: boolean;

  @Prop({ default: false, required: false, type: Boolean })
  readonly enableCompareView!: boolean;

  @Prop({ required: true, type: Array }) readonly files!:
    | EvaluationFile[]
    | ProfileFile[];

  @Prop({ required: true, type: String }) readonly headerText!: string;

  @Prop({ required: false, type: String }) readonly route!: string;

  get allSelectedValue(): boolean {
    return this.allSelected === Trinary.On;
  }

  get anyItemSelected(): boolean {
    return this.anySelected;
  }

  get isIndeterminate(): boolean {
    return this.allSelected === Trinary.Mixed;
  }

  get selectAllText(): string {
    return this.allSelected === Trinary.On ? 'Deselect' : 'Select';
  }
}
</script>
