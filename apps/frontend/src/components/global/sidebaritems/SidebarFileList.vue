<template>
  <v-list-item :title="file.filename" @click.stop="select_file_exclusive">
    <v-list-item-action @click.stop="select_file">
      <v-checkbox :input-value="selected" color="blue" />
    </v-list-item-action>

    <v-list-item-avatar>
      <v-icon small v-text="icon" />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title v-text="file.filename" />
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
import Component, {mixins} from 'vue-class-component';
import axios from 'axios';
import {InspecDataModule} from '@/store/data_store';
import {FilteredDataModule} from '@/store/data_filters';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';

import ServerMixin from '@/mixins/ServerMixin';
import {Prop} from 'vue-property-decorator';
import {ICreateEvaluation} from '@heimdall/interfaces';
import RouteMixin from '@/mixins/RouteMixin';

@Component
export default class FileItem extends mixins(ServerMixin, RouteMixin) {
  @Prop({type: Object}) readonly file!: EvaluationFile | ProfileFile;

  saving = false;
  saved = (typeof this.file.database_id !== 'undefined')


  select_file() {
    if (this.file.hasOwnProperty('evaluation')) {
      FilteredDataModule.toggle_evaluation(this.file.unique_id);
    } else if (this.file.hasOwnProperty('profile')) {
      FilteredDataModule.toggle_profile(this.file.unique_id);
    }
  }

  select_file_exclusive() {
    if (this.file.hasOwnProperty('evaluation')) {
      FilteredDataModule.select_exclusive_evaluation(this.file.unique_id);
    } else if (this.file.hasOwnProperty('profile')) {
      FilteredDataModule.select_exclusive_profile(this.file.unique_id);
    }
  }

  //checks if file is selected
  get selected(): boolean {
    return FilteredDataModule.selected_file_ids.includes(this.file.unique_id);
  }

  //removes uploaded file from the currently observed files
  remove_file() {
    InspecDataModule.removeFile(this.file.unique_id);
    // Remove any database files that may have been in the URL
    // by calling the router and causing it to write the appropriate
    // route to the URL bar
    this.navigateWithNoErrors(`/${this.current_route}`);
  }

  //saves file to database
  save_file() {
    if (this.file?.database_id){
      SnackbarModule.failure('This file is already in the database.')
    } else if (this.file) {
      this.save_to_database(this.file);
    }
  }

  //determines if the use can save the file
  get disable_saving() {
    return (typeof this.file?.database_id !== 'undefined') || this.saved || this.saving
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
      if(typeof value !== 'undefined') {
        formData.append(key, value);
      }
    }
    // Add evaluation data to the form
    if (file.hasOwnProperty('evaluation')){ // If this is an evaluation
      formData.append("data", new Blob([JSON.stringify((file as EvaluationFile).evaluation.data)], {type: 'text/plain'}));
    } else { // Or if it is a profile
     formData.append("data", new Blob([JSON.stringify((file as ProfileFile).profile.data)], {type: 'text/plain'}));
    }

    axios
      .post('/evaluations', formData)
      .then(() => {
        SnackbarModule.notify('File saved successfully');
      })
      .catch((error) => {
        SnackbarModule.failure(error.response.data.message);
      }).finally(() => {
        this.saving = false;
        this.saved = true;
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
