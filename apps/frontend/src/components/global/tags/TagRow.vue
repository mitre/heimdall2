<template>
  <div>
    <v-edit-dialog large @save="save" @cancel="syncEvaluationTags">
      <template v-for="tag in evaluation.evaluationTags">
        <v-chip :key="tag.id + '_'" small close @click:close="deleteTag(tag)">{{
          tag.value
        }}</v-chip>
      </template>
      <v-icon small class="ma-2"> mdi-tag-plus </v-icon>
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
    <DeleteDialog
      v-model="deleteTagDialog"
      type="tag"
      @cancel="deleteTagDialog = false"
      @confirm="deleteTagConfirm"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {EvaluationModule} from '@/store/evaluations';
import {SnackbarModule} from '../../../store/snackbar';
import {IEvaluation, IEvaluationTag} from '@heimdall/interfaces';
import {Prop} from 'vue-property-decorator';
import DeleteDialog from '@/components/generic/DeleteDialog.vue';

@Component({
  components: {
    DeleteDialog
  }
})
export default class TagRow extends Vue {
  @Prop({required: true, type: Object}) readonly evaluation!: IEvaluation;

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

  mounted() {
    this.syncEvaluationTags();
  }

  onChange() {
    this.search = '';
  }

  save() {
    const original = this.evaluationTagsToStrings();
    const toAdd: string[] = this.tags.filter(tag => !original.includes(tag));
    const toRemove: IEvaluationTag[] = this.evaluation.evaluationTags.filter(tag => !this.tags.includes(tag.value));
    const addedTagPromises = toAdd.map((tag) => {
      return EvaluationModule.addTag({evaluation: this.evaluation, tag: {value: tag}})
    });

    const removedTagPromises = toRemove.map((tag) => {
      return EvaluationModule.deleteTag(tag);
    });

    Promise.all(addedTagPromises.concat(removedTagPromises)).then(() => {
      SnackbarModule.notify("Successfully updated tags.")
    }).finally(() => {
      EvaluationModule.getAllEvaluations();
    });
  }

  syncEvaluationTags() {
    this.tags = this.evaluationTagsToStrings();
  }

  evaluationTagsToStrings(): string[] {
    return this.evaluation.evaluationTags.map((tag) => tag.value);
  }

  async deleteTag(tag: IEvaluationTag) {
    this.activeTag = tag;
    this.deleteTagDialog = true;
  }

  deleteTagConfirm() {
    EvaluationModule.deleteTag(this.activeTag).then(() => {
      SnackbarModule.notify("Deleted tag successfully.")
      EvaluationModule.getAllEvaluations().then(() => {
        this.syncEvaluationTags();
      });
    });
    this.deleteTagDialog = false;
  }

  get allEvaluationTags(): string[] {
    // Hide the search dropdown if the current search is empty
    // Otherwise the save button is covered up when the search is empty
    if(this.search)
    {
      return EvaluationModule.allEvaluationTags;
    }
    else {
      return [];
    }
  }
}
</script>
