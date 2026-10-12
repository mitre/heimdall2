<template>
  <div v-if="evaluation">
    <v-edit-dialog
      large
      @save="save"
      @open="syncEvaluationTags"
      @cancel="syncEvaluationTags"
    >
      <template v-for="tag in evaluation.evaluationTags">
        <v-chip
          v-if="evaluation.editable"
          :key="tag.id + '_'"
          small
          close
          @click:close="deleteTag(tag)"
        >
          {{ tag.value }}
        </v-chip>
        <v-chip v-else :key="tag.id + '_'" small>{{ tag.value }}</v-chip>
      </template>
      <v-icon
        v-if="evaluation.editable"
        small
        class="ma-2"
        title="Edit/Add Tag(s)"
      >
        mdi-tag-plus
      </v-icon>
      <template #input>
        <v-combobox
          v-model="tags"
          :items="allEvaluationTags"
          :search-input.sync="search"
          :hide-no-data="!search"
          :hide-details="true"
          hide-selected
          label="Add Tags"
          multiple
          chips
          deletable-chips
          @change="onChange"
        >
          <template #no-data>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  No results matching "<strong>{{ search }}</strong
                  >". Press <kbd>tab</kbd> to create a new one
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </template>
        </v-combobox>
      </template>
    </v-edit-dialog>
    <ActionDialog
      v-model="deleteTagDialog"
      type="tag"
      @cancel="deleteTagDialog = false"
      @confirm="deleteTagConfirm"
    />
  </div>
</template>

<script lang="ts">
import ActionDialog from '@/components/generic/ActionDialog.vue';
import {EvaluationModule} from '@/store/evaluations';
import {SnackbarModule} from '@/store/snackbar';
import {IEvaluation, IEvaluationTag} from '@heimdall/common/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    ActionDialog
  }
})
export default class TagRow extends Vue {
  @Prop({required: true}) readonly evaluation!: IEvaluation;
  @Prop({type: Boolean, default: false}) onLoadingPanel!: boolean;

  tags: string[] = [];
  search = '';
  deleteTagDialog = false;
  activeTag: IEvaluationTag = {
    evaluationId: '-1',
    id: '-1',
    value: '',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  params = {
    offset: EvaluationModule.offset,
    limit: EvaluationModule.limit,
    order: EvaluationModule.order
  };

  mounted() {
    this.syncEvaluationTags();
  }

  onChange() {
    this.search = '';
  }

  async save() {
    const original = this.evaluationTagsToStrings();
    const toAdd: string[] = this.tags.filter((tag) => !original.includes(tag));
    const toRemove: IEvaluationTag[] = this.evaluation.evaluationTags.filter(
      (tag) => !this.tags.includes(tag.value)
    );
    const addedTagPromises = toAdd.map((tag) =>
      EvaluationModule.addTag({evaluation: this.evaluation, tag: {value: tag}})
    );

    const removedTagPromises = toRemove.map((tag) =>
      EvaluationModule.deleteTag(tag)
    );

    try {
      await Promise.all([...addedTagPromises, ...removedTagPromises]);
      SnackbarModule.notify('Successfully updated tags.');
    } finally {
      // Refresh even when a tag call failed (the axios interceptor snackbar
      // reports the failure) so the list shows the actual server state.
      if (this.onLoadingPanel) {
        await EvaluationModule.getAllEvaluations(this.params);
        if (
          EvaluationModule.evaluationLoaded(this.evaluation.id) !== undefined
        ) {
          await EvaluationModule.loadEvaluation(this.evaluation.id);
        }
      } else {
        await EvaluationModule.loadEvaluation(this.evaluation.id);
      }
    }
  }

  // Used to update the Tags in the v-combobox
  syncEvaluationTags() {
    this.tags = this.evaluationTagsToStrings();
  }

  evaluationTagsToStrings(): string[] {
    return this.evaluation.evaluationTags.map((tag) => tag.value) || [];
  }

  deleteTag(tag: IEvaluationTag) {
    this.activeTag = tag;
    this.deleteTagDialog = true;
  }

  async deleteTagConfirm() {
    // Close the dialog immediately; the delete proceeds in the background
    // and failures surface via the axios interceptor snackbar.
    this.deleteTagDialog = false;
    await EvaluationModule.deleteTag(this.activeTag);
    SnackbarModule.notify('Deleted tag successfully.');
    if (this.onLoadingPanel) {
      await EvaluationModule.getAllEvaluations(this.params);
      if (
        EvaluationModule.evaluationLoaded(this.evaluation.id) !== undefined
      ) {
        await EvaluationModule.loadEvaluation(this.evaluation.id);
      }
    } else {
      await EvaluationModule.loadEvaluation(this.evaluation.id);
      this.syncEvaluationTags();
    }
  }

  get allEvaluationTags(): string[] {
    // Hide the search dropdown if the current search is empty
    // Otherwise the save button is covered up when the search is empty
    if (this.search) {
      return EvaluationModule.allEvaluationTags;
    } else {
      return [];
    }
  }
}
</script>
