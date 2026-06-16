<template>
  <v-list-item
    :title="file.filename"
    @change="$emit('changed-files')"
    @click.stop="select_file_exclusive"
  >
    <v-list-item-action @click.stop="select_file">
      <v-checkbox :input-value="selected" color="blue" />
    </v-list-item-action>

    <v-list-item-avatar>
      <v-icon small>{{ icon }}</v-icon>
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>
        {{ file.filename }}
        <v-icon
          v-if="file.hasUnsavedChanges"
          class="ml-2"
          color="warning"
          small
          title="Unsaved comments edits"
        >
          mdi-content-save-alert
        </v-icon>
      </v-list-item-title>
    </v-list-item-content>

    <v-list-item-action v-if="serverMode" @click.stop="save_file">
      <v-btn data-cy="saveFile" icon small :disabled="disable_saving">
        <v-icon :title="save_button_title"> mdi-content-save </v-icon>
      </v-btn>
    </v-list-item-action>

    <v-list-item-action @click.stop="remove_file">
      <v-btn data-cy="closeFile" icon small>
        <v-icon title="Remove entry from result set">
          mdi-playlist-remove
        </v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>
</template>

<script lang="ts">
import RouteMixin from '@/mixins/RouteMixin';
import ServerMixin from '@/mixins/ServerMixin';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule, UNSAVED_CHANGES_MESSAGE} from '@/store/data_store';
import {EvaluationModule} from '@/store/evaluations';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {ICreateEvaluation, IEvaluation} from '@heimdall/common/interfaces';
import axios from 'axios';
import * as _ from 'lodash';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

const REVIEW_TAG = 'heimdall:review';
const REVIEW_ROOT_TAG_PREFIX = 'heimdall:review-root:';
const REVIEW_PARENT_TAG_PREFIX = 'heimdall:review-parent:';
const REVIEW_FILENAME_SUFFIX = /\s+- review \d{4}-\d{2}-\d{2} \d{2}-\d{2}$/u;

type SaveToDatabaseOptions = {
  filename?: string;
  successMessage?: string;
  tagValues?: string[];
};

@Component
export default class SidebarFileList extends mixins(ServerMixin, RouteMixin) {
  @Prop({type: Object}) readonly file!: EvaluationFile | ProfileFile;

  saving = false;

  select_file() {
    if (this.file.hasOwnProperty('evaluation')) {
      FilteredDataModule.toggle_evaluation(this.file.uniqueId);
    } else if (this.file.hasOwnProperty('profile')) {
      FilteredDataModule.toggle_profile(this.file.uniqueId);
    }
  }

  select_file_exclusive() {
    if (this.file.hasOwnProperty('evaluation')) {
      FilteredDataModule.select_exclusive_evaluation(this.file.uniqueId);
    } else if (this.file.hasOwnProperty('profile')) {
      FilteredDataModule.select_exclusive_profile(this.file.uniqueId);
    }
  }

  //checks if file is selected
  get selected(): boolean {
    return FilteredDataModule.selected_file_ids.includes(this.file.uniqueId);
  }

  //removes uploaded file from the currently observed files
  remove_file() {
    if (
      this.file.hasUnsavedChanges &&
      !globalThis.confirm(`${UNSAVED_CHANGES_MESSAGE}\n\nRemove it anyway?`)
    ) {
      return;
    }

    EvaluationModule.removeEvaluation(this.file.uniqueId);
    InspecDataModule.removeFile(this.file.uniqueId);
    // Remove any database files that may have been in the URL
    // by calling the router and causing it to write the appropriate
    // route to the URL bar
    this.navigateWithNoErrors(`/${this.current_route}`);
  }

  //saves file to database
  save_file() {
    if (this.saving) {
      return;
    }

    if (this.file?.database_id) {
      if (!this.file.hasUnsavedChanges) {
        SnackbarModule.failure('This file is already in the database.');
        return;
      }
      this.save_reviewed_copy(this.file);
    } else if (this.file) {
      this.save_to_database(this.file);
    }
  }

  //determines if the use can save the file
  get disable_saving() {
    return (
      this.saving ||
      (this.file?.database_id !== undefined && !this.file.hasUnsavedChanges)
    );
  }

  get save_button_title(): string {
    if (this.file?.database_id !== undefined) {
      return 'Save reviewed copy to the database';
    }
    return 'Save entry to the database';
  }

  file_data(file: EvaluationFile | ProfileFile) {
    if (file.hasOwnProperty('evaluation')) {
      return _.get(file, 'evaluation.data');
    }
    return _.get(file, 'profile.data');
  }

  review_timestamp(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )} ${pad(now.getHours())}-${pad(now.getMinutes())}`;
  }

  review_copy_filename(filename: string): string {
    return `${filename.replace(
      REVIEW_FILENAME_SUFFIX,
      ''
    )} - review ${this.review_timestamp()}`;
  }

  review_root_id(evaluation: IEvaluation | undefined): string | undefined {
    const tagValues = evaluation?.evaluationTags?.map((tag) => tag.value) ?? [];
    return tagValues
      .find((tag) => tag.startsWith(REVIEW_ROOT_TAG_PREFIX))
      ?.slice(REVIEW_ROOT_TAG_PREFIX.length);
  }

  reviewed_copy_tags(
    sourceEvaluation: IEvaluation | undefined,
    sourceDatabaseId: string
  ): string[] {
    const sourceTags =
      sourceEvaluation?.evaluationTags?.map((tag) => tag.value) ?? [];
    const rootId = this.review_root_id(sourceEvaluation) ?? sourceDatabaseId;
    const reviewTags = [
      REVIEW_TAG,
      `${REVIEW_ROOT_TAG_PREFIX}${rootId}`,
      `${REVIEW_PARENT_TAG_PREFIX}${sourceDatabaseId}`
    ];
    return [
      ...new Set(
        sourceTags
          .filter(
            (tag) =>
              tag !== REVIEW_TAG &&
              !tag.startsWith(REVIEW_ROOT_TAG_PREFIX) &&
              !tag.startsWith(REVIEW_PARENT_TAG_PREFIX)
          )
          .concat(reviewTags)
      )
    ];
  }

  save_reviewed_copy(file: EvaluationFile | ProfileFile) {
    const sourceDatabaseId = file.database_id?.toString();
    if (!sourceDatabaseId) {
      this.save_to_database(file);
      return;
    }

    const sourceEvaluation = EvaluationModule.evaluationForFile(file) as
      | IEvaluation
      | undefined;
    this.save_to_database(file, {
      filename: this.review_copy_filename(file.filename),
      successMessage: 'Reviewed copy saved successfully',
      tagValues: this.reviewed_copy_tags(sourceEvaluation, sourceDatabaseId)
    });
  }

  append_create_evaluation_form_data(
    formData: FormData,
    createEvaluationDto: ICreateEvaluation
  ) {
    formData.append('filename', createEvaluationDto.filename);
    formData.append('public', String(createEvaluationDto.public));
    formData.append(
      'evaluationTags',
      createEvaluationDto.evaluationTags
        ?.map((evaluationTag) => evaluationTag.value)
        .join(',') ?? ''
    );
    if (createEvaluationDto.groups !== undefined) {
      formData.append('groups', createEvaluationDto.groups.join(','));
    }
  }

  save_to_database(
    file: EvaluationFile | ProfileFile,
    options: SaveToDatabaseOptions = {}
  ) {
    this.saving = true;
    const filename = options.filename ?? file.filename;

    const createEvaluationDto: ICreateEvaluation = {
      filename,
      public: false,
      evaluationTags:
        options.tagValues?.map((tagValue) => ({value: tagValue})) ?? [],
      groups: undefined
    };

    // Create a multipart form to upload our data
    const formData = new FormData();
    this.append_create_evaluation_form_data(formData, createEvaluationDto);
    // Add evaluation data to the form
    formData.append(
      'data',
      new Blob([JSON.stringify(this.file_data(file))], {
        type: 'text/plain'
      })
    );
    axios
      .post<IEvaluation>('/evaluations', formData)
      .then((response) => {
        SnackbarModule.notify(
          options.successMessage ?? 'File saved successfully'
        );
        file.filename = filename;
        file.database_id = Number.parseInt(response.data.id, 10);
        InspecDataModule.markFileSaved(file.uniqueId);
        EvaluationModule.loadEvaluation(response.data.id);
        const loadedDatabaseIds = InspecDataModule.loadedDatabaseIds.join(',');
        this.navigateWithNoErrors(
          `/${this.current_route}/${loadedDatabaseIds}`
        );
      })
      .catch((error) => {
        SnackbarModule.failure(error.response.data.message);
      })
      .finally(() => {
        this.saving = false;
      });
  }

  //gives different icons for a file if it is just a profile
  get icon(): string {
    if (this.file.hasOwnProperty('profile')) {
      return 'mdi-note';
    } else {
      return 'mdi-google-analytics';
    }
  }
}
</script>
