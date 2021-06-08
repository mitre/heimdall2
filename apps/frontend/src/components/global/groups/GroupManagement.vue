<template>
  <v-card>
    <v-card-title v-if="!allGroups" class="pb-0">
      <GroupModal id="groupModal" :create="true">
        <template #clickable="{on, attrs}"
          ><v-btn
            color="primary"
            data-cy="createNewGroupBtn"
            class="mb-2"
            v-bind="attrs"
            v-on="on"
          >
            Create New Group
          </v-btn>
        </template>
      </GroupModal>
    </v-card-title>
    <v-data-table
      :headers="allGroups ? allGroupsHeaders : myGroupsHeaders"
      :items="allGroups ? allGroupData : myGroupData"
      class="elevation-0"
      dense
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
            dense
            hide-details
          />
        </v-container>
      </template>
      <template #[`item.users`]="{item}">
        <v-chip
          pill
          color="primary"
          class="ma-1"
          v-on="on"
          @click="displayMembersDialog(item.users[0], -1)"
        >
          {{ getMemberNames(item.users)[0].identifier }}
        </v-chip>
        <v-chip
          pill
          color="primary"
          outlined
          class="ma-1"
          v-on="on"
          @click="displayMembersDialog(item.users, 1)"
        >
          + {{ getMemberNames(item.users).length - 1 }} others
        </v-chip>
      </template>
      <template #[`item.actions`]="{item}">
        <div v-if="item.role == 'owner'">
          <GroupModal id="editGroupModal" :create="false" :group="item">
            <template #clickable="{on}"
              ><v-icon small title="Edit" data-cy="edit" class="mr-2" v-on="on">
                mdi-pencil
              </v-icon>
            </template>
          </GroupModal>
          <v-icon
            small
            title="Delete"
            data-cy="delete"
            @click="deleteGroupDialog(item)"
          >
            mdi-delete
          </v-icon>
        </div>
      </template>
      <template #no-data> No groups match current selection. </template>
    </v-data-table>
    <DeleteDialog
      v-model="dialogDelete"
      type="group"
      @cancel="closeDeleteDialog"
      @confirm="deleteGroupConfirm"
    />
    <GroupUsers
      :display="dialogDisplayUsers"
      :members="selectedGroupUsers"
      @close-users-display="dialogDisplayUsers = false"
    />
  </v-card>
</template>

<script lang="ts">
import {SnackbarModule} from '@/store/snackbar';
import {IGroup, ISlimUser} from '@heimdall/interfaces';
import GroupModal from '@/components/global/groups/GroupModal.vue';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {GroupsModule} from '@/store/groups';
import DeleteDialog from '@/components/generic/DeleteDialog.vue';
import GroupUsers from '@/components/global/groups/GroupUsers.vue';

@Component({
  components: {
    DeleteDialog,
    GroupModal,
    GroupUsers
  }
})
export default class GroupManagement extends Vue {
  @Prop({type: Boolean, default: false}) readonly allGroups!: boolean;

  editedGroup: IGroup | null = null;
  selectedGroupUsers: ISlimUser[] | null = [];
  dialogDelete = false;
  dialogDisplayUsers = false;
  search = '';
  allGroupsHeaders: Object[] = [
    {
      text: 'Group Name',
      align: 'start',
      sortable: true,
      value: 'name',
    },
    {
      text: 'Public',
      sortable: true,
      value: 'public'
    }
  ];
  myGroupsHeaders: Object[] = [
    {
      text: 'ID',
      sortable: true,
      value: 'id',
    },
    ...this.allGroupsHeaders,
    {text: 'Your Role', value: 'role', sortable: true},
    {text: 'Members', value: 'users', sortable: true},
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
      }).finally(() => {
        this.closeDeleteDialog();
      });
    }
  }

  closeDeleteDialog() {
    this.dialogDelete = false
    this.editedGroup = null;
  }

  getMemberNames(users: ISlimUser[]): Object {
    let result = [{}];

    for(let i = 0; i < users.length; i++) {
      if(!users[i].firstName && !users[i].lastName) {
        result[i] = {identifier: users[i].email};
      }
      else {
        result[i] = {identifier: users[i].firstName + " " + users[i].lastName};
      }
    }
    return result;
  }

  displayMembersDialog(members: ISlimUser[], startingIndex: number) {
    // If there is only one member, add it to a ISlimUser array.
    if(!Array.isArray(members)) {
      const singleMember: ISlimUser[] = [members];
      this.selectedGroupUsers = [...singleMember];
      this.dialogDisplayUsers = true;
    }
    else {
      const modified: ISlimUser[] = [...members];
      // Splices out the members already displayed as "pills"
      for(let i = 0; i < startingIndex; i++) {
        modified.splice(i, 1);
      }
      this.selectedGroupUsers = [...modified];
      this.dialogDisplayUsers = true;
    }
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
