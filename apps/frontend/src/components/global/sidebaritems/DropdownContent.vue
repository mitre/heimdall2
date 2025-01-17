<template>
  <v-expansion-panel v-model="activePath" expand>
    <v-expansion-panel-header :title="headerText">
      {{ headerText }}
    </v-expansion-panel-header>
    <v-expansion-panel-content v-if="files.length > 0">
      <v-list dense>
        <FileList
          v-for="(file, i) in filteredInFiles"
          :key="i"
          :file="file"
          @changed-files="$emit('changed-files')"
        />

        <v-list-item v-if="anyFileFilteredOut">
          <v-list-item-content>
            Filtered-out {{ headerText }}
          </v-list-item-content>

          <v-list-item-action
            @click.stop="showFilteredOutFiles = !showFilteredOutFiles"
          >
            <v-btn icon small>
              <v-icon>{{
                showFilteredOutFiles ? 'mdi-chevron-up' : 'mdi-chevron-down'
              }}</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>

        <v-expand-transition v-if="anyFileFilteredOut && showFilteredOutFiles">
          <FileList
            v-for="(file, i) in filteredOutFiles"
            :key="i"
            :file="file"
            @changed-files="$emit('changed-files')"
          />
        </v-expand-transition>

        <v-divider v-if="!inChecklistView" />

        <v-list-item
          v-if="!inChecklistView"
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
            <v-icon small>mdi-format-list-bulleted</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title>
              <div>{{ selectAllText }} all {{ headerText.toLowerCase() }}</div>
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-row v-if="!inChecklistView" class="pt-5 pb-5" justify="center">
          <v-btn
            small
            style="cursor: pointer"
            :disabled="!anyItemSelected"
            @click="$emit('remove-selected')"
          >
            <span>Remove selected {{ headerText }} </span>
            <v-icon right>mdi-text-box-remove-outline</v-icon>
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
import FileList from '@/components/global/sidebaritems/SidebarFileList.vue';
import {FilesFilter, fileMatchesFilter} from '@/store/data_filters';
import {InspecFile} from '@/store/report_intake';
import {SearchModule} from '@/store/search';
import {Trinary} from '@/enums/Trinary';
import {AppInfoModule, views} from '@/store/app_info';
import {Component, Prop, Vue} from 'vue-property-decorator';

@Component({
  components: {
    FileList
  }
})
export default class DropdownContent extends Vue {
  @Prop({type: String, required: true}) readonly headerText!: string;
  @Prop({type: String, required: false}) readonly allSelected!: Trinary;
  @Prop({type: Array, required: true}) readonly files!: InspecFile[];

  @Prop({type: String, required: false}) readonly route!: string;
  @Prop({default: false, type: Boolean, required: false})
  readonly compareViewActive!: boolean;

  @Prop({default: false, type: Boolean, required: false})
  readonly enableCompareView!: boolean;

  @Prop({default: false, type: Boolean, required: false})
  readonly anySelected!: boolean;

  @Prop({default: 0, type: Number, required: true})
  readonly activePath!: number;

  showFilteredOutFiles = false;

  get filteredInFiles(): InspecFile[] {
    if (this.inChecklistView) return this.files;
    else return this.files.filter((file) => !this.fileFilteredOut(file));
  }

  get filteredOutFiles(): InspecFile[] {
    if (this.inChecklistView) return [];
    else return this.files.filter((file) => this.fileFilteredOut(file));
  }

  get anyFileFilteredOut(): boolean {
    return (
      !this.inChecklistView && this.files.some((f) => this.fileFilteredOut(f))
    );
  }

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

  get inChecklistView(): boolean {
    return AppInfoModule.currentView === views.Checklist;
  }

  get filesFilter(): FilesFilter {
    return {
      filenameSearchTerms: SearchModule.fileMetadataSearchTerms.filename,
      userGroupSearchTerms: SearchModule.fileMetadataSearchTerms.group,
      evalTagSearchTerms: SearchModule.fileMetadataSearchTerms.evalTag
    } as FilesFilter;
  }

  get fileFilteredOut(): (file: InspecFile) => boolean {
    return (file: InspecFile) => {
      return !fileMatchesFilter(file, this.filesFilter);
    };
  }
}
</script>
