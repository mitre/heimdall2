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
          v-if="isDirty"
          class="ml-2"
          color="warning"
          small
          title="Unsaved edits"
        >
          mdi-content-save-alert
        </v-icon>
      </v-list-item-title>
    </v-list-item-content>

    <v-list-item-action v-if="serverMode" @click.stop="save_file">
      <v-btn data-cy="saveFile" icon small :disabled="disable_saving">
        <v-icon title="Save entry to the database"> mdi-content-save </v-icon>
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
import {InspecDataModule} from '@/store/data_store';
import {EvaluationModule} from '@/store/evaluations';
import type {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import type {ICreateEvaluation, IEvaluation} from '@heimdall/common/interfaces';
import axios from 'axios';
import * as _ from 'lodash';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

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

  get isDirty(): boolean {
    return InspecDataModule.isFileDirty(this.file.uniqueId);
  }

  file_data(file: EvaluationFile | ProfileFile): unknown {
    if ('evaluation' in file) {
      return file.evaluation.data;
    }
    return file.profile.data;
  }

  remove_file() {
    EvaluationModule.removeEvaluation(this.file.uniqueId);
    InspecDataModule.removeFile(this.file.uniqueId);
    this.navigateWithNoErrors(`/${this.current_route}`);
  }

  save_file() {
    if (this.file?.database_id && this.isDirty) {
      this.update_database_file(this.file);
    } else if (this.file?.database_id) {
      SnackbarModule.failure('This file is already in the database.');
    } else if (this.file) {
      this.save_to_database(this.file);
    }
  }

  get disable_saving(): boolean {
    return (
      this.saving ||
      (this.file?.database_id !== undefined && !this.isDirty)
    );
  }

  update_database_file(file: EvaluationFile | ProfileFile) {
    const evaluation = EvaluationModule.evaluationForFile(file) as
      | IEvaluation
      | undefined;
    if (!evaluation) {
      SnackbarModule.failure('Could not find the database entry for this file.');
      return;
    }
    this.saving = true;
    EvaluationModule.updateEvaluation({
      ...evaluation,
      data: this.file_data(file)
    } as IEvaluation)
      .then(() => {
        SnackbarModule.notify('File saved successfully');
        InspecDataModule.markFileSaved([file.uniqueId]);
      })
      .catch((error) => {
        SnackbarModule.HTTPFailure(error);
      })
      .finally(() => {
        this.saving = false;
      });
  }

  save_to_database(file: EvaluationFile | ProfileFile) {
    this.saving = true;

    const createEvaluationDto: ICreateEvaluation = {
      filename: file.filename,
      public: false,
      evaluationTags: [],
      groups: undefined
    };

    // Create a multipart form to upload our data
    const formData = new FormData();
    // Add the DTO objects to form data
    for (const [key, value] of Object.entries(createEvaluationDto)) {
      if (typeof value !== 'undefined') {
        formData.append(key, value);
      }
    }
    formData.append(
      'data',
      new Blob([JSON.stringify(this.file_data(file))], {
        type: 'text/plain'
      })
    );
    axios
      .post<IEvaluation>('/evaluations', formData)
      .then((response) => {
        SnackbarModule.notify('File saved successfully');
        file.database_id = parseInt(response.data.id);
        InspecDataModule.markFileSaved([file.uniqueId]);
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
