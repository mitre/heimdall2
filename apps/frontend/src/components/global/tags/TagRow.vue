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
        <v-chip
          v-else
          :key="tag.id + '_'"
          small
        >
          {{ tag.value }}
        </v-chip>
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
                  No results matching "<strong>{{ search }}</strong>". Press <kbd>tab</kbd> to create a new one
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
import type { IEvaluation, IEvaluationTag } from '@heimdall/common/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ActionDialog from '@/components/generic/ActionDialog.vue';
import { EvaluationModule } from '@/store/evaluations';
import { SnackbarModule } from '@/store/snackbar';

@Component({ components: { ActionDialog } })
export default class TagRow extends Vue {
  activeTag: IEvaluationTag = {
    createdAt: new Date(),
    evaluationId: '-1',
    id: '-1',
    updatedAt: new Date(),
    value: '',
  };

  deleteTagDialog = false;

  @Prop({ required: true }) readonly evaluation!: IEvaluation;
  @Prop({ default: false, type: Boolean }) onLoadingPanel!: boolean;
  params = {
    limit: EvaluationModule.limit,
    offset: EvaluationModule.offset,
    order: EvaluationModule.order,
  };

  search = '';

  tags: string[] = [];

  get allEvaluationTags(): string[] {
    // Hide the search dropdown if the current search is empty
    // Otherwise the save button is covered up when the search is empty
    return this.search ? EvaluationModule.allEvaluationTags : [];
  }

  async deleteTag(tag: IEvaluationTag) {
    this.activeTag = tag;
    this.deleteTagDialog = true;
  }

  deleteTagConfirm() {
    EvaluationModule.deleteTag(this.activeTag).then(() => {
      SnackbarModule.notify('Deleted tag successfully.');
      if (this.onLoadingPanel) {
        EvaluationModule.getAllEvaluations(this.params);
        if (
          EvaluationModule.evaluationLoaded(this.evaluation.id) !== undefined
        ) {
          EvaluationModule.loadEvaluation(this.evaluation.id);
        }
      } else {
        EvaluationModule.loadEvaluation(this.evaluation.id).then(() => {
          this.syncEvaluationTags();
        });
      }
    });
    this.deleteTagDialog = false;
  }

  evaluationTagsToStrings(): string[] {
    return this.evaluation.evaluationTags.map(tag => tag.value) || [];
  }

  mounted() {
    this.syncEvaluationTags();
  }

  onChange() {
    this.search = '';
  }

  save() {
    const original = this.evaluationTagsToStrings();
    const toAdd: string[] = this.tags.filter(tag => !original.includes(tag));
    const toRemove: IEvaluationTag[] = this.evaluation.evaluationTags.filter(
      tag => !this.tags.includes(tag.value),
    );
    const addedTagPromises = toAdd.map(tag =>
      EvaluationModule.addTag({ evaluation: this.evaluation, tag: { value: tag } }),
    );

    const removedTagPromises = toRemove.map(tag =>
      EvaluationModule.deleteTag(tag),
    );

    Promise.all([...addedTagPromises, ...removedTagPromises])
      .then(() => SnackbarModule.notify('Successfully updated tags.'))
      .finally(() => {
        if (this.onLoadingPanel) {
          EvaluationModule.getAllEvaluations(this.params);
          if (
            EvaluationModule.evaluationLoaded(this.evaluation.id) !== undefined
          ) {
            EvaluationModule.loadEvaluation(this.evaluation.id);
          }
        } else {
          EvaluationModule.loadEvaluation(this.evaluation.id);
        }
      });
  }

  // Used to update the Tags in the v-combobox
  syncEvaluationTags() {
    this.tags = this.evaluationTagsToStrings();
  }
}
</script>
