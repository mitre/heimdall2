<template>
  <BaseView title="Profile">
    <template #topbar-content />

    <!-- The main content: cards, etc -->
    <template #main-content>
      <v-container fluid grid-list-md pa-2>
        <!-- Evaluation Info -->
        <!-- Profile information -->
        <v-card>
          <v-row class="pa-4" justify="space-between">
            <v-col cols="5">
              <p><b>Name:</b> {{ user.first_name }} {{ user.last_name }}</p>
              <p><b>Email:</b> {{ user.email }}</p>
              <p><b>Created:</b> {{ user.created_at }}</p>
              <p><b>Updated:</b> {{ user.updated_at }}</p>
            </v-col>
            <v-divider vertical />
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
              <v-card-subtitle>
                Easily load any supported Heimdall Data Format file
              </v-card-subtitle>
              <v-container>
                <v-data-table
                  dense
                  :headers="headers"
                  :items="evaluations"
                  :search="search"
                  item-key="id"
                >
                  <template v-slot:[`item.createdAt`]="{item}">
                    <span>{{ new Date(item.createdAt).toLocaleString() }}</span>
                  </template>
                </v-data-table>
              </v-container>
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
              />
              <v-btn class="mr-4" @click="add_to_group">submit</v-btn>
            </v-list>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </BaseView>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import BaseView from '@/views/BaseView.vue';
import axios from 'axios';

import {ServerModule} from '@/store/server';
import {UserProfile, Evaluation, Usergroup} from '@/types/models.ts';
import UserMenu from '@/components/global/UserMenu.vue';
import {IEvaluation} from '@heimdall/interfaces';

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
    UserMenu
  }
})
export default class Profile extends ProfileProps {
  show_groups: boolean = true;
  edit_groups: boolean = false;
  user_id: number | null = null;
  group_name: string | null = null;
  selected: number[] | null = null;
  selected_group: number | null = null;
  evaluations: IEvaluation[] = [];

  mounted() {
    this.load_evaluations();
  }

  get headers(): Object[] {
    return [
      {
        text: 'Filename',
        align: 'start',
        sortable: true,
        value: 'filename'
      },
      {text: 'Uploaded', value: 'createdAt', sortable: true},
      {text: 'Load', value: 'load', sortable: false}
    ];
  }
  get search(): string {
    return '';
  }

  get isLoading(): Boolean {
    return false;
  }

  get user(): UserProfile {
    if (ServerModule.profile) {
      this.user_id = ServerModule.profile.id;
      return ServerModule.profile;
    } else {
      return new UserProfile();
    }
  }

  load_evaluations(): void {
    axios.get<IEvaluation[]>('/evaluations').then(response => {
      this.evaluations = response.data;
    });
  }

  get usergroups(): Usergroup[] {
    if (ServerModule.usergroups) {
      return ServerModule.usergroups;
    } else {
      return [];
    }
  }

  evaluation_label(evaluation: Evaluation): string {
    let label = evaluation.version;
    if (evaluation.tags) {
      evaluation.tags.forEach(tag => {
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
    const host = process.env.VUE_APP_API_URL!;

    if (this.group_name) {
      let group_hash: UsergroupHash = {
        name: this.group_name
      };
      (this.$refs.form as any).reset();
      await ServerModule.connect(host)
        .catch(bad => {
          console.error('Unable to connect to ' + host);
        })
        .then(() => {
          return ServerModule.new_usergroup(group_hash);
        })
        .catch(bad => {
          console.error(`bad save ${bad}`);
        })
        .then(() => {});
    }
  }

  async add_to_group(): Promise<void> {
    const host = process.env.VUE_APP_API_URL!;

    if (this.selected && this.selected_group) {
      let group_hash: AddToUsergroupHash = {
        group_id: this.selected_group,
        evaluation_ids: this.selected
      };
      await ServerModule.connect(host)
        .catch(bad => {
          console.error('Unable to connect to ' + host);
        })
        .then(() => {
          return ServerModule.add_to_usergroup(group_hash);
        })
        .catch(bad => {
          console.error(`bad save ${bad}`);
        })
        .then(() => {});
    }
  }
}
</script>

<style scoped>
.glow {
  box-shadow: 0px 0px 8px 6px #5a5;
}
</style>
