<template>
  <v-list-item
    :title="file.filename"
    @change="$emit('changed-files')"
    @click.stop="select_file_exclusive"
  >
    <v-list-item-action @click.stop="select_file">
      <v-checkbox
        v-if="currentView !== 'checklists'"
        :input-value="selected"
        color="blue"
      />

      <!-- Due to how Vuetify handles radio buttons a value of 0 will select the radio button and -1 will deselect it-->
      <v-radio-group v-else :value="selected ? 0 : -1">
        <v-radio :value="0" color="blue" />
      </v-radio-group>
    </v-list-item-action>

    <v-list-item-avatar>
      <v-icon small>{{ icon }}</v-icon>
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title>{{ file.filename }}</v-list-item-title>
    </v-list-item-content>

    <v-list-item-action v-if="serverMode" @click.stop="save_file">
      <v-btn data-cy="saveFile" icon small :disabled="disable_saving">
        <v-icon> mdi-content-save </v-icon>
      </v-btn>
    </v-list-item-action>

    <v-list-item-action @click.stop="remove_file">
      <v-btn data-cy="closeFile" icon small>
        <v-icon> mdi-close </v-icon>
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
import {ICreateEvaluation, IEvaluation} from '@heimdall/interfaces';
import axios from 'axios';
import _ from 'lodash';
import Component, {mixins} from 'vue-class-component';
import {ChecklistFile} from '@mitre/hdf-converters';
import {Prop} from 'vue-property-decorator';
import {AppInfoModule} from '@/store/app_info';

@Component
export default class SidebarFileList extends mixins(ServerMixin, RouteMixin) {
  @Prop({type: Object}) readonly file!:
    | EvaluationFile
    | ProfileFile
    | ChecklistFile;

  saving = false;

  select_file() {
    if (this.file.hasOwnProperty('evaluation')) {
      FilteredDataModule.toggle_evaluation(this.file.uniqueId);
    } else if (this.file.hasOwnProperty('profile')) {
      FilteredDataModule.toggle_profile(this.file.uniqueId);
    } else if (this.file.hasOwnProperty('asset')) {
      // Currently checklist can only be exclusively selected so there is no need for a toggle function
      FilteredDataModule.select_exclusive_checklist(this.file.uniqueId);
    }
  }

  select_file_exclusive() {
    if (this.file.hasOwnProperty('evaluation')) {
      FilteredDataModule.select_exclusive_evaluation(this.file.uniqueId);
    } else if (this.file.hasOwnProperty('profile')) {
      FilteredDataModule.select_exclusive_profile(this.file.uniqueId);
    } else if (this.file.hasOwnProperty('stigs')) {
      FilteredDataModule.select_exclusive_checklist(this.file.uniqueId);
    }
  }

  /** Current application view */
  get currentView() {
    return AppInfoModule.currentView;
  }

  /** Checks if file is selected */
  get selected(): boolean {
    return FilteredDataModule.selected_file_ids.includes(this.file.uniqueId);
  }

  //removes uploaded file from the currently observed files
  remove_file() {
    InspecDataModule.removeFile(this.file.uniqueId);
    // Remove any database files that may have been in the URL
    // by calling the router and causing it to write the appropriate
    // route to the URL bar
    this.navigateWithNoErrors(`/${this.currentRoute}`);
  }

  //saves file to database
  save_file() {
    if (this.file?.database_id) {
      SnackbarModule.failure('This file is already in the database.');
    } else if (this.file) {
      this.save_to_database(this.file);
    }
  }

  //determines if the user can save the file
  get disable_saving() {
    return typeof this.file?.database_id !== 'undefined' || this.saving;
  }

  save_to_database(file: EvaluationFile | ProfileFile | ChecklistFile) {
    // TODO: handle the case of a checklist file
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
    if (file.hasOwnProperty('evaluation')) {
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
    axios
      .post<IEvaluation>('/evaluations', formData)
      .then((response) => {
        SnackbarModule.notify('File saved successfully');
        file.database_id = parseInt(response.data.id);
        EvaluationModule.loadEvaluation(response.data.id);
        const loadedDatabaseIds = InspecDataModule.loadedDatabaseIds.join(',');
        this.navigateWithNoErrors(`/${this.currentRoute}/${loadedDatabaseIds}`);
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
