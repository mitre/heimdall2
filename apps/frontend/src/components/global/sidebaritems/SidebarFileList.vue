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
      <v-btn icon small :disabled="disable_saving">
        <v-icon> mdi-content-save </v-icon>
      </v-btn>
    </v-list-item-action>

    <v-list-item-action @click.stop="remove_file">
      <v-btn icon small>
        <v-icon> mdi-close </v-icon>
      </v-btn>
    </v-list-item-action>
  </v-list-item>
</template>

<script lang="ts">
import Component, {mixins} from 'vue-class-component';
import axios from 'axios';
import {ICreateEvaluation} from '@heimdall/interfaces';
import {InspecDataModule} from '@/store/data_store';
import {FilteredDataModule} from '@/store/data_filters';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';

import ServerMixin from '@/mixins/ServerMixin';
import {Prop} from 'vue-property-decorator';
import {ServerModule} from '@/store/server';

@Component
export default class FileItem extends mixins(ServerMixin) {
  @Prop({type: Object}) readonly file!: EvaluationFile | ProfileFile;

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
  }

  //saves file to database
  save_file() {
    if (this.file?.database_id){
      SnackbarModule.failure('This evaluation is already in the databse.')
    }
    else if (this.file) {
      if (this.file.hasOwnProperty('evaluation')) {
        this.save_evaluation(this.file as EvaluationFile);
      }
    }
  }

  //determines if the use can save the file
  get disable_saving() {
    return (typeof this.file?.database_id !== 'undefined')
  }

  save_evaluation(file: EvaluationFile) {
    let evaluationDTO: ICreateEvaluation = {
      data: file.evaluation.data,
      filename: file.filename,
      userId: ServerModule.userInfo.id,
      evaluationTags: []
    };

    axios
      .post('/evaluations', evaluationDTO)
      .then((response) => {
        SnackbarModule.notify('Result saved successfully');
        file.database_id = parseInt(response.data.id);
      })
      .catch((error) => {
        SnackbarModule.failure(error.response.data.message);
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
