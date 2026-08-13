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
      <v-list-item-title>{{ file.filename }}</v-list-item-title>
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
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {ICreateEvaluation, IEvaluation} from '@heimdall/common/interfaces';
import axios from 'axios';
import * as _ from 'lodash';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component
export default class SidebarFileList extends mixins(ServerMixin, RouteMixin) {
  @Prop({type: Object}) readonly file!: EvaluationFile | ProfileFile;

  saving = false;

  select_file() {
    if (Object.hasOwn(this.file, 'evaluation')) {
      FilteredDataModule.toggle_evaluation(this.file.uniqueId);
    } else if (Object.hasOwn(this.file, 'profile')) {
      FilteredDataModule.toggle_profile(this.file.uniqueId);
    }
  }

  select_file_exclusive() {
    if (Object.hasOwn(this.file, 'evaluation')) {
      FilteredDataModule.select_exclusive_evaluation(this.file.uniqueId);
    } else if (Object.hasOwn(this.file, 'profile')) {
      FilteredDataModule.select_exclusive_profile(this.file.uniqueId);
    }
  }

  // checks if file is selected
  get selected(): boolean {
    return FilteredDataModule.selected_file_ids.includes(this.file.uniqueId);
  }

  // removes uploaded file from the currently observed files
  async remove_file(): Promise<void> {
    // The evaluation lookup reads the file entry, so it must finish
    // before removeFile deletes that entry.
    await EvaluationModule.removeEvaluation(this.file.uniqueId);
    InspecDataModule.removeFile(this.file.uniqueId);
    // Remove any database files that may have been in the URL
    // by calling the router and causing it to write the appropriate
    // route to the URL bar
    this.navigateWithNoErrors(`/${this.current_route}`);
  }

  // saves file to database
  save_file() {
    if (this.file?.database_id) {
      SnackbarModule.failure('This file is already in the database.');
    } else if (this.file) {
      // Fire-and-forget: save_to_database reports its own outcome.
      void this.save_to_database(this.file);
    }
  }

  // determines if the use can save the file
  get disable_saving() {
    return typeof this.file?.database_id !== 'undefined' || this.saving;
  }

  async save_to_database(file: EvaluationFile | ProfileFile): Promise<void> {
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
    // Add evaluation data to the form
    if (Object.hasOwn(file, 'evaluation')) {
      formData.append(
        'data',
        new Blob([JSON.stringify(_.get(file, 'evaluation.data'))], {
          type: 'text/plain'
        })
      );
    } else {
      formData.append(
        'data',
        new Blob([JSON.stringify(_.get(file, 'profile.data'))], {
          type: 'text/plain'
        })
      );
    }
    try {
      const response = await axios.post<IEvaluation>('/evaluations', formData);
      SnackbarModule.notify('File saved successfully');
      file.database_id = parseInt(response.data.id);
      await EvaluationModule.loadEvaluation(response.data.id);
      const loadedDatabaseIds = InspecDataModule.loadedDatabaseIds.join(',');
      this.navigateWithNoErrors(`/${this.current_route}/${loadedDatabaseIds}`);
    } catch (error) {
      // A network failure has no response body; the old chain crashed
      // reading it and reported nothing.
      SnackbarModule.failure(
        axios.isAxiosError<{message?: string}>(error)
          ? (error.response?.data?.message ?? error.message)
          : String(error)
      );
    } finally {
      this.saving = false;
    }
  }

  // gives different icons for a file if it is just a profile
  get icon(): string {
    if (Object.hasOwn(this.file, 'profile')) {
      return 'mdi-note';
    } else {
      return 'mdi-google-analytics';
    }
  }
}
</script>
