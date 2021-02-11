<template>
  <v-card>
    <v-card-title v-if="!allGroups" class="pb-0">
      <GroupModal id="groupModal" :create="true">
        <template #clickable="{on, attrs}"
          ><v-btn color="primary" class="mb-2" v-bind="attrs" v-on="on">
            Create New Group
          </v-btn>
        </template>
      </GroupModal>
    </v-card-title>
    <v-data-table
      :headers="allGroups ? allGroupsHeaders : myGroupsHeaders"
      :items="allGroups ? allGroupData : myGroupData"
      class="elevation-0"
      :loading="loading"
      :search="search"
    >
      <template #top>
        <v-container>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
          />
        </v-container>
      </template>
      <template #[`item.actions`]="{item}">
        <GroupModal id="editGroupModal" :create="false" :group="item">
          <template #clickable="{on}"
            ><v-icon small title="Edit" class="mr-2" v-on="on">
              mdi-pencil
            </v-icon>
          </template>
        </GroupModal>
        <v-icon small title="Delete" @click="deleteGroupDialog(item)">
          mdi-delete
        </v-icon>
      </template>
      <template #no-data> No groups match current selection. </template>
    </v-data-table>
    <v-dialog v-model="dialogDelete" max-width="550px">
      <v-card>
        <v-card-title class="headline"
          >Are you sure you want to delete this group?</v-card-title
        >
        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="closeDeleteDialog"
            >Cancel</v-btn
          >
          <v-btn color="blue darken-1" text @click="deleteGroupConfirm"
            >OK</v-btn
          >
          <v-spacer />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import {SnackbarModule} from '@/store/snackbar';
import {IGroup} from '@heimdall/interfaces';
import GroupModal from '@/components/global/groups/GroupModal.vue';
import axios from 'axios';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {GroupsModule} from '@/store/groups';

@Component({
  components: {
    GroupModal
  }
})
export default class GroupManagement extends Vue {
  @Prop({type: Boolean, default: false}) readonly allGroups!: boolean;

  editedGroup: IGroup | null = null;
  dialogDelete: boolean = false;
  search: string = '';
  allGroupsHeaders: Object[] = [
    {
      text: 'Group Name',
      align: 'start',
      sortable: true,
      value: 'name'
    },
    {
    text: 'Public',
      sortable: true,
      value: 'public'
    }
  ];
  myGroupsHeaders: Object[] = [
    ...this.allGroupsHeaders,
    {text: 'Your Role', value: 'role', sortable: true},
    {text: 'Actions', value: 'actions', sortable: false},
  ];

  deleteGroupDialog(group: IGroup): void {
    this.editedGroup = group;
    this.dialogDelete = true
  }

  deleteGroupConfirm(): void {
    if (this.editedGroup) {
      GroupsModule.DeleteGroup(this.editedGroup).then((data) => {
        SnackbarModule.notify(`Successfully deleted group ${data.name}`);
      }).catch((err) => {
        // If the backend provided an error then show it, otherwise fallback to printing the client side error
        SnackbarModule.failure(err?.response?.data?.message || `${err}. Please reload the page and try again.`);
      }).finally(() => {
        this.closeDeleteDialog();
      });
    }
  }

  closeDeleteDialog () {
    this.dialogDelete = false
    this.editedGroup = null;
  }

  get loading(): boolean {
    return GroupsModule.loading;
  }

  get allGroupData(): IGroup[] {
    return GroupsModule.allGroups;
  }

  get myGroupData(): IGroup[] {
    return GroupsModule.myGroups;
  }
}
</script>
