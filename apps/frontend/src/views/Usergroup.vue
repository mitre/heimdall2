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
            <v-col cols="5"> <b>Name:</b> {{ usergroup.name }}<br /> </v-col>
            <v-divider vertical></v-divider>
            <v-col v-if="show_group" class="text-center">
              <div v-if="usergroup.users" class="column_wrapper">
                <div v-for="item in usergroup.users" :key="item.id">
                  <b>{{ item.email }}</b>
                </div>
              </div>
            </v-col>
            <v-col v-if="edit_group" class="text-center">
              <div class="column_wrapper">
                <v-list dense class="px-2" subheader>
                  <v-subheader>Add User</v-subheader>
                  <v-form ref="form">
                    <v-select
                      v-model="selected_user"
                      :items="users"
                      item-text="email"
                      item-value="id"
                      label="Select"
                      single-line
                    ></v-select>
                    <v-btn class="mr-4" @click="submit_user">submit</v-btn>
                  </v-form>
                </v-list>
              </div>
            </v-col>
            <v-btn v-if="show_group" icon small @click="open_usergroup_edit">
              <v-icon class="float-right"> mdi-pencil-box-outline </v-icon>
            </v-btn>
            <v-btn v-if="edit_group" icon small @click="close_usergroup_edit">
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
                  :items="usergroup.evaluations"
                  :search="search"
                  :hide-default-header="hideHeaders"
                  :show-select="showSelect"
                  :loading="isLoading"
                  item-key="name"
                  class="elevation-1"
                >
                  <template v-slot:body="{items}">
                    <tbody>
                      <tr
                        v-for="item in usergroup.evaluations"
                        :key="item.name"
                      >
                        <td>{{ evaluation_label(item) }}</td>
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
export interface GetUsergroupHash {
  group_id: number;
}
export interface AddMemberUsergroupHash {
  group_id: number;
  user_id: number;
}

// We declare the props separately
// to make UsergroupProps types inferrable.
const UsergroupProps = Vue.extend({
  props: {}
});

@Component({
  components: {
    BaseView,
    UploadNexus,
    UserMenu
  }
})
export default class UsergroupView extends UsergroupProps {
  dialog: boolean = false;
  is_server_mode: boolean = true;
  show_group: boolean = true;
  edit_group: boolean = false;
  user_id: number | null = null;
  group_id: number | null = null;
  selected: number[] | null = null;
  selected_user: number | null = null;
  curr_title: string = 'Usergroup';

  created() {
    this.group_id = Number(this.$route.params.id);
    console.log('created');
    this.load_usergroup();
    this.load_users();
  }

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

  get users(): UserProfile[] {
    let mod = getModule(ServerModule, this.$store);
    if (mod.users) {
      return mod.users;
    } else {
      return [];
    }
  }

  get usergroup(): Usergroup {
    let mod = getModule(ServerModule, this.$store);
    if (mod.usergroup) {
      return mod.usergroup;
    } else {
      return new Usergroup();
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

  async load_usergroup(): Promise<void> {
    const host = process.env.VUE_APP_API_URL!;
    let group_hash: GetUsergroupHash = {
      group_id: Number(this.$route.params.id)
    };

    console.log('load this usergroup: ' + group_hash['group_id']);

    let mod = getModule(ServerModule, this.$store);
    await mod
      .connect(host)
      .catch(bad => {
        console.error('Unable to connect to ' + host);
      })
      .then(() => {
        console.log('here');
        return mod.retrieve_usergroup(group_hash);
      })
      .catch(bad => {
        console.error(`bad login ${bad}`);
      })
      .then(() => {
        console.log('Loaded usergroup');
      });
  }

  async load_users(): Promise<void> {
    const host = process.env.VUE_APP_API_URL!;
    console.log('load users: ');

    let mod = getModule(ServerModule, this.$store);
    await mod
      .connect(host)
      .catch(bad => {
        console.error('Unable to connect to ' + host);
      })
      .then(() => {
        console.log('here');
        return mod.retrieve_users();
      })
      .catch(bad => {
        console.error(`bad login ${bad}`);
      })
      .then(() => {
        console.log('Loaded users');
      });
  }

  open_usergroup_edit() {
    this.show_group = false;
    this.edit_group = true;
  }

  close_usergroup_edit() {
    this.show_group = true;
    this.edit_group = false;
  }

  async submit_user(): Promise<void> {
    console.log('submit ' + this.group_id + ', ' + this.selected_user);
    const host = process.env.VUE_APP_API_URL!;

    if (this.group_id && this.selected_user) {
      let group_hash: AddMemberUsergroupHash = {
        group_id: this.group_id,
        user_id: this.selected_user
      };
      (this.$refs.form as any).reset();
      let mod = getModule(ServerModule, this.$store);
      await mod
        .connect(host)
        .catch(bad => {
          console.error('Unable to connect to ' + host);
        })
        .then(() => {
          return mod.add_team_member(group_hash);
        })
        .catch(bad => {
          console.error(`bad save ${bad}`);
        })
        .then(() => {
          console.log('here');
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
