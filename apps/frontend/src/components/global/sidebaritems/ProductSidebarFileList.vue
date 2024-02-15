<template>
  <v-list-item :title=file @change="$emit('changed-files')" @click.stop="select_file_exclusive">
    <v-list-item-action @click.stop="select_file">
      <v-checkbox :input-value="selected" color="blue" />
    </v-list-item-action>

    <v-list-item-avatar>
      <v-icon small v-text="icon" />
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title v-text=file_text() />
    </v-list-item-content>

  </v-list-item>
</template>

<script lang="ts">
import RouteMixin from '@/mixins/RouteMixin';
import ServerMixin from '@/mixins/ServerMixin';
import {FilteredDataModule} from '@/store/data_filters';
import {InspecDataModule} from '@/store/data_store';
import {EvaluationFile, ProfileFile} from '@/store/report_intake';
import {SourcedContextualizedProfile} from '@/store/report_intake';
import {SourcedContextualizedEvaluation} from '@/store/report_intake';
import {assessment_eval} from '@/store/assessment_data';
import _ from 'lodash';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component
export default class SidebarFileList extends mixins(ServerMixin, RouteMixin) {
  @Prop({type: Object}) readonly file!: EvaluationFile | ProfileFile;
  sourcedFile!: SourcedContextualizedEvaluation | SourcedContextualizedProfile;

  saving = false;

  mounted(){
    let sourced = FilteredDataModule.evaluation(this.file.uniqueId)
    if (sourced != undefined){
      this.sourcedFile = sourced;
    }
  }

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

  get sourced_file() {
      return this.sourcedFile;
  }

  set sourced_file(sf: SourcedContextualizedEvaluation | SourcedContextualizedProfile) {
      this.sourcedFile = sf;
  }

  //checks if file is selected
  get selected(): boolean {
    return FilteredDataModule.selected_file_ids.includes(this.file.uniqueId);
  }

  //removes uploaded file from the currently observed files
  remove_file() {
    InspecDataModule.removeFile(this.file.uniqueId);
    // Remove any database files that may have been in the URL
    // by calling the router and causing it to write the appropriate
    // route to the URL bar
    this.navigateWithNoErrors(`/${this.current_route}`);
  }

  get_result_type(): string {

    return assessment_eval((this.sourcedFile as SourcedContextualizedEvaluation)).toString();
  }

  file_text(): string {
    if (this.is_stig_result()) {
      return "STIG: " + this.file.filename
    } else if (this.is_vuln_result()) {
      return "Vulnerabiltiy: " + this.file.filename
    } else if (this.is_gen_result()) {
      return "General: " + this.file.filename
    } else {
      return this.file.filename
    }
  }

  is_stig_result() {
    return this.get_result_type() === 'stig';
  }

  is_gen_result() {
    return this.get_result_type() === 'general';
  }

  is_vuln_result() {
    return this.get_result_type() === 'vulnerability';
  }

  get icon(): string {
    let sourced = FilteredDataModule.evaluation(this.file.uniqueId)
    if (sourced != undefined){
      this.sourcedFile = sourced;
    }

    const assessment_type = assessment_eval((this.sourcedFile as SourcedContextualizedEvaluation)).toString();
    switch (assessment_type) {
      // case BucketType.General:
      case 'general':
        return 'mdi-file-chart-outline';
      // case BucketType.STIGASD:
      case 'stig':
        return 'mdi-application-brackets';
      // case BucketType.Vulnerability:
      case "vulnerability":
        return 'mdi-alert-circle-outline';
      default:
        return 'mdi-file-chart-outline'
    }
  }
}
</script>
