<template>
  <BaseView :title="curr_title">
    <!-- Topbar config - give it a search bar -->
    <template #topbar-content>
      <v-btn @click="dialog = true" :disabled="dialog" class="mx-2">
        <span class="d-none d-md-inline pr-2">
          Load
        </span>
        <v-icon>
          mdi-cloud-upload
        </v-icon>
      </v-btn>
      <UserMenu />
    </template>

    <!-- The main content: cards, etc -->
    <template #main-content>
      <v-container fluid grid-list-md pa-2>
        <!-- Evaluation Info -->
        <!-- Profile information -->
        <v-card>
          <v-row class="pa-4" justify="space-between">
            <v-col cols="5">
              <b>Name:</b> {{ user.first_name }} {{ user.last_name }}<br />
              <b>Email:</b> {{ user.email }}<br />
              <b>Created:</b> {{ user.created_at }}<br />
              <b>Updated:</b> {{ user.updated_at }}<br />
            </v-col>
            <v-divider vertical></v-divider>
            <v-col v-if="show_groups" class="text-center">
              <div v-if="usergroups" class="column_wrapper">
                <v-list dense class="px-2" subheader>
                  <v-subheader>Groups</v-subheader>
                  <div v-for="item in usergroups" :key="item.id">
                    <v-list-item :to="group_url(item)" title="Show Group">
                      <v-list-item-content>
                        <v-list-item-title>{{ item.name }}</v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </div>
                </v-list>
              </div>
            </v-col>
            <v-col v-if="edit_groups" class="text-center">
              <div class="column_wrapper">
                <v-list dense class="px-2" subheader>
                  <v-subheader>Add Usergroup</v-subheader>
                  <v-form ref="form">
                    <v-text-field v-model="group_name" label="Group Name" />
                    <v-btn class="mr-4" @click="submit_usergroup">submit</v-btn>
                  </v-form>
                </v-list>
              </div>
            </v-col>
            <v-btn v-if="show_groups" icon small @click="open_usergroups_edit">
              <v-icon class="float-right"> mdi-pencil-box-outline </v-icon>
            </v-btn>
            <v-btn v-if="edit_groups" icon small @click="close_usergroups_edit">
              <v-icon class="float-right"> mdi-close </v-icon>
            </v-btn>
          </v-row>
        </v-card>
        <v-row>
          <v-col xs-12>
            <v-card class="elevation-0">
              <v-card-subtitle
                >Easily load any supported Heimdall Data Format
                file</v-card-subtitle
              >
              <v-container>
                <v-data-table
                  dense
                  :headers="headers"
                  :items="items"
                  :search="search"
                  :hide-default-header="hideHeaders"
                  :show-select="showSelect"
                  :loading="isLoading"
                  item-key="name"
                  class="elevation-1"
                >
                  <template v-slot:body="{items}">
                    <tbody>
                      <tr v-for="item in items" :key="item.name">
                        <td>{{ item.filename }}</td>
                        <td>{{ item.createdAt }}</td>
                        <td>{{ item.version }}</td>
                        <td>
                          <v-btn icon @click="load_this_evaluation(item)">
                            <v-icon>mdi-plus-circle</v-icon>
                          </v-btn>
                        </td>
                        <td>
                          <v-checkbox
                            v-model="selected"
                            :value="item.id"
                            multiple
                          ></v-checkbox>
                        </td>
                      </tr>
                    </tbody>
                  </template>
                </v-data-table>
              </v-container>
              <p>Selected: {{ selected }}</p>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col xs-12>
            <v-list dense class="px-2" subheader>
              <v-subheader>Add selected to Usergroup</v-subheader>
              <v-select
                v-model="selected_group"
                :items="usergroups"
                item-text="name"
                item-value="id"
                label="Select"
                single-line
              ></v-select>
              <v-btn class="mr-4" @click="add_to_group">submit</v-btn>
            </v-list>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- File select modal -->
    <UploadNexus v-model="dialog" @got-files="on_got_files" />
  </BaseView>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import BaseView from '@/views/BaseView.vue';
import UploadNexus from '@/components/global/UploadNexus.vue';
import InspecIntakeModule, {
  FileID,
  next_free_file_ID
} from '@/store/report_intake';
import {plainToClass} from 'class-transformer';
import {getModule} from 'vuex-module-decorators';
import InspecDataModule from '../store/data_store';
import ServerModule from '@/store/server';
import {UserProfile, Evaluation, Usergroup} from '@/types/models.ts';
import UserMenu from '@/components/global/UserMenu.vue';

export interface RetrieveHash {
  unique_id: number;
  eva: Evaluation;
}

export interface UsergroupHash {
  name: string;
}
export interface AddToUsergroupHash {
  group_id: number;
  evaluation_ids: number[];
}

// We declare the props separately
// to make ProfileProps types inferrable.
const ProfileProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    BaseView,
    UploadNexus,
    UserMenu
  }
})
export default class Profile extends ProfileProps {
  dialog: boolean = false;
  is_server_mode: boolean = true;
  show_groups: boolean = true;
  edit_groups: boolean = false;
  user_id: number | null = null;
  group_name: string | null = null;
  selected: number[] | null = null;
  selected_group: number | null = null;
  curr_title: string = 'Profile';

  get headers(): Object[] {
    return [
      {
        text: 'Filename',
        align: 'start',
        sortable: true,
        value: 'filename'
      },
      {text: 'Uploaded', sortable: true, value: 'createdAt'},
      {text: 'Version', sortable: true, value: 'version'},
      {text: 'Load', sortable: false},
      {text: 'Select', sortable: false}
    ];
  }
  get search(): string {
    return '';
  }
  get hideHeaders(): Boolean {
    return false;
  }
  get showSelect(): Boolean {
    return false;
  }
  get isLoading(): Boolean {
    return false;
  }

  get user(): UserProfile {
    let mod = getModule(ServerModule, this.$store);
    if (mod.profile) {
      this.user_id = mod.profile.id;
      return mod.profile;
    } else {
      return new UserProfile();
    }
  }

  get items(): Evaluation[] {
    let mod = getModule(ServerModule, this.$store);
    if (mod.user_evaluations) {
      let eval_obj = Array.from(mod.user_evaluations) || [];
      const evals: Evaluation[] = eval_obj.map((x: any) =>
        plainToClass(Evaluation, x)
      );
      console.log('evals: ' + evals.length);
      evals.forEach(eva => {
        eva.filename = this.evaluation_label(eva);
      });
      return evals;
    } else {
      return [new Evaluation()];
    }
  }

  get usergroups(): Usergroup[] {
    console.log('Get usergroups');
    let mod = getModule(ServerModule, this.$store);
    if (mod.usergroups) {
      console.log('Return usergroups: ' + JSON.stringify(mod.usergroups));
      return mod.usergroups;
    } else {
      console.log('No usergroups');
      return [];
    }
  }

  evaluation_label(evaluation: Evaluation): string {
    let label = evaluation.version;
    if (evaluation.tags) {
      evaluation.tags.forEach(tag => {
        console.log('tag ' + tag.content.name + ': ' + tag.content.value);
        if (tag.content.name == 'filename') {
          label = tag.content.value;
        }
      });
    }
    return label;
  }

  group_url(usergroup: Usergroup): string {
    return '/usergroup/' + usergroup.id;
  }

  open_usergroups_edit() {
    this.show_groups = false;
    this.edit_groups = true;
  }

  close_usergroups_edit() {
    this.show_groups = true;
    this.edit_groups = false;
  }

  async submit_usergroup(): Promise<void> {
    console.log('submit ' + this.group_name);
    const host = process.env.VUE_APP_API_URL!;

    if (this.group_name) {
      let group_hash: UsergroupHash = {
        name: this.group_name
      };
      (this.$refs.form as any).reset();
      // Get server module
      let mod = getModule(ServerModule, this.$store);
      await mod
        .connect(host)
        .catch(bad => {
          console.error('Unable to connect to ' + host);
        })
        .then(() => {
          return mod.new_usergroup(group_hash);
        })
        .catch(bad => {
          console.error(`bad save ${bad}`);
        })
        .then(() => {
          console.log('here2');
        });
    }
  }

  async load_this_evaluation(evaluation: Evaluation): Promise<void> {
    console.log('load this file: ' + evaluation.id);
    const host = process.env.VUE_APP_API_URL!;
    // Generate an id
    let unique_id = next_free_file_ID();

    let mod = getModule(ServerModule, this.$store);
    await mod
      .connect(host)
      .catch(bad => {
        console.error('Unable to connect to ' + host);
      })
      .then(() => {
        console.log('here');
        let eva_hash: RetrieveHash = {
          unique_id: unique_id,
          eva: evaluation
        };
        return mod.retrieve_evaluation(eva_hash);
      })
      .catch(bad => {
        console.error(`bad login ${bad}`);
      })
      .then(() => {
        console.log('Loaded ' + unique_id);
        this.on_got_files([unique_id]);
      });
  }

  async add_to_group(): Promise<void> {
    console.log('Add ' + this.selected + ' to ' + this.selected_group);
    const host = process.env.VUE_APP_API_URL!;

    if (this.selected && this.selected_group) {
      let group_hash: AddToUsergroupHash = {
        group_id: this.selected_group,
        evaluation_ids: this.selected
      };
      let mod = getModule(ServerModule, this.$store);
      await mod
        .connect(host)
        .catch(bad => {
          console.error('Unable to connect to ' + host);
        })
        .then(() => {
          return mod.add_to_usergroup(group_hash);
        })
        .catch(bad => {
          console.error(`bad save ${bad}`);
        })
        .then(() => {
          console.log('here2');
        });
    }
  }

  profile_page() {
    this.dialog = false;
    this.$router.push('/profile');
  }

  log_out() {
    getModule(ServerModule, this.$store).clear_token();
    this.dialog = false;
    this.$router.push('/');
  }

  /**
   * Invoked when file(s) are loaded.
   */
  on_got_files(ids: FileID[]) {
    // Close the dialog
    this.dialog = false;

    // If just one file, focus it
    if (ids.length === 1) {
      this.$router.push(`/results/${ids[0]}`);
    }

    // If more than one, focus all.
    // TODO: Provide support for focusing a subset of files
    else if (ids.length > 1) {
      this.$router.push(`/results/all`);
    }
  }
}
</script>

<style scoped>
.glow {
  box-shadow: 0px 0px 8px 6px #5a5;
}
</style>
