<template>
  <v-row class="pa-4" justify="space-between">
    <v-col :cols="info_cols">
      <b>Filename:</b> {{ filename }}<br />
      <b>Tool Version:</b> {{ inspec_version }}<br />
      <b>Platform:</b> {{ platform }}<br />
      <b>Duration:</b> {{ get_duration }}<br />
    </v-col>
    <!--v-divider vertical></v-divider-->
    <v-col v-if="show_tags" class="text-center">
      <div v-if="tags" class="column_wrapper">
        <div v-for="item in tags.filter(not_filename)" :key="item.id">
          <b>{{ item.content.name }}:</b> {{ item.content.value }}
        </div>
      </div>
    </v-col>
    <v-col v-if="edit_tags" class="text-center">
      <div class="column_wrapper">
        <v-list v-if="tags" dense class="px-2" subheader>
          <v-subheader>Remove Tag</v-subheader>
          <div v-for="item in tags.filter(not_filename)" :key="item.id">
            <b>{{ item.content.name }}:</b> {{ item.content.value }}
            <v-btn icon small @click="remove_tag(item)">
              <v-icon> mdi-close </v-icon>
            </v-btn>
          </div>
        </v-list>
        <v-list dense class="px-2" subheader>
          <v-subheader>Add Tag</v-subheader>
          <v-form ref="form">
            <v-combobox
              v-model="tag_name"
              :items="tag_list"
              label="Tag Name"
              dense
            />
            <v-text-field v-model="tag_value" label="Value" />
            <v-btn class="mr-4" @click="submit_tag">submit</v-btn>
          </v-form>
        </v-list>
      </div>
    </v-col>
    <v-btn v-if="show_tags" icon small @click="open_tag_edit">
      <v-icon class="float-right"> mdi-pencil-box-outline </v-icon>
    </v-btn>
    <v-btn v-if="edit_tags" icon small @click="close_tag_edit">
      <v-icon class="float-right"> mdi-close </v-icon>
    </v-btn>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {InspecDataModule} from '@/store/data_store';
import {ServerModule} from '@/store/server';
import {FilteredDataModule} from '../../store/data_filters';
import {EvaluationFile} from '../../store/report_intake';

import {plainToClass} from 'class-transformer';
import {Tag} from '@/types/models.ts';
import VeeValidate from 'vee-validate';

Vue.use(VeeValidate);

export interface TagIdsHash {
  id: number;
  tagger_id: number;
}
export interface TagHash {
  tagger_id: number;
  name: string;
  value: string;
}

// We declare the props separately
// to make props types inferrable.
const EvaluationInfoProps = Vue.extend({
  props: {
    file_filter: Number // Of type Filer from filteredData
  }
});

@Component({
  components: {}
})
export default class EvaluationInfo extends EvaluationInfoProps {
  filename2: string | null = null;
  version: string | null = null;
  platform_name: string | null = null;
  platform_release: string | null = null;
  duration: number | null | undefined = null;
  tags: Tag[] | null = null;
  show_tags: boolean = true;
  edit_tags: boolean = false;
  tag_name: string | null = null;
  tag_value: string | null = null;
  database_id: number | null = null;

  created() {
    this.load_file();
  }

  updated() {
    let file = InspecDataModule.allFiles.find(
      f => f.unique_id === this.file_filter
    );
    if (file) {
      let eva = file as EvaluationFile;
      this.version = eva.evaluation.data.version;
      this.platform_name = eva.evaluation.data.platform.name;
      this.platform_release = eva.evaluation.data.platform.release;
      this.duration = eva.evaluation.data.statistics.duration;
      this.database_id = eva.database_id || null;
    }
    if (!this.database_id) {
      this.show_tags = false;
      this.edit_tags = false;
    } else {
      this.show_tags = true;
    }
  }

  mounted() {
    if (!this.database_id) {
      this.show_tags = false;
      this.edit_tags = false;
    } else {
      this.show_tags = true;
    }
  }

  get filename(): string {
    return this.file.filename;
  }

  get inspec_version(): string {
    return this.file.evaluation.data.version;
  }

  get platform(): string {
    return (
      this.file.evaluation.data.platform.name +
      this.file.evaluation.data.platform.release
    );
  }

  get get_duration(): string {
    return this.file.evaluation.data.statistics.duration + '';
  }

  //gets file to retrieve corresponding data
  get file(): EvaluationFile {
    return FilteredDataModule.evaluations([this.file_filter])[0].from_file;
  }

  //gives more room for actual info when the "tags" button is not displayed
  get info_cols(): number {
    if (ServerModule.serverMode) {
      return 5;
    }
    return 12;
  }

  load_file() {
    let file = InspecDataModule.allFiles.find(
      f => f.unique_id === this.file_filter
    );
    if (file) {
      let eva = file as EvaluationFile;
      this.filename2 = eva.filename;
      this.version = eva.evaluation.data.version;
      this.platform_name = eva.evaluation.data.platform.name;
      this.platform_release = eva.evaluation.data.platform.release;
      this.duration = eva.evaluation.data.statistics.duration;
      this.tags = eva.tags || null;
      if (eva.database_id === null) {
        this.show_tags = false;
        this.edit_tags = false;
      } else {
        this.database_id = eva.database_id || null;
      }
    }
  }

  open_tag_edit() {
    this.show_tags = false;
    this.edit_tags = true;
  }

  close_tag_edit() {
    this.show_tags = true;
    this.edit_tags = false;
  }

  not_filename(tag: Tag) {
    return tag.content.name != 'filename';
  }

  async submit_tag(): Promise<void> {
    const host = process.env.VUE_APP_API_URL!;

    let file_id: number | null = this.database_id;
    if (file_id && this.tag_name && this.tag_value) {
      let tag_hash: TagHash = {
        tagger_id: file_id,
        name: this.tag_name,
        value: this.tag_value
      };
      (this.$refs.form as any).reset();
      // Get server module
      await ServerModule.connect(host)
        .catch(bad => {
          console.error('Unable to connect to ' + host);
        })
        .then(() => {
          return ServerModule.save_tag(tag_hash);
        })
        .catch(bad => {
          console.error(`bad save ${bad}`);
        })
        .then(() => {
          if (file_id !== null) {
            this.load_tags(file_id);
          }
        });
    }
  }

  async remove_tag(tag: Tag): Promise<void> {
    const host = process.env.VUE_APP_API_URL!;
    let tag_hash: TagIdsHash = {
      tagger_id: tag.tagger_id,
      id: tag.id
    };
    // Get server module
    await ServerModule.connect(host)
      .catch(bad => {
        console.error('Unable to connect to ' + host);
      })
      .then(() => {
        return ServerModule.delete_tag(tag_hash);
      })
      .catch(bad => {
        console.error(`bad delete ${bad}`);
      })
      .then(() => {
        this.load_tags(tag.tagger_id);
      });
  }

  get tag_list(): String[] {
    return ['Hostname', 'UUID', 'FISMA System', 'Environment'];
  }

  watches() {
    if (ServerModule.tags) {
      let tags_obj = Array.from(ServerModule.tags) || [];
      const eva_tags: Tag[] = tags_obj.map((x: any) => plainToClass(Tag, x));
      this.tags = eva_tags;
      return this.tags;
    } else {
      return null;
    }
  }

  update_tags() {
    if (ServerModule.tags) {
      let tags_obj = Array.from(ServerModule.tags) || [];
      const eva_tags: Tag[] = tags_obj.map((x: any) => plainToClass(Tag, x));
      this.tags = eva_tags;
    }
  }

  async load_tags(file_id: number | null): Promise<void> {
    if (file_id) {
      const host = process.env.VUE_APP_API_URL!;

      await ServerModule.connect(host)
        .catch(bad => {
          console.error('Unable to connect to ' + host);
        })
        .then(() => {
          return ServerModule.retrieve_tags(file_id);
        })
        .catch(bad => {
          console.error(`bad retrieve ${bad}`);
        })
        .then(() => {
          this.update_tags();
        });
    }
  }
}
</script>
