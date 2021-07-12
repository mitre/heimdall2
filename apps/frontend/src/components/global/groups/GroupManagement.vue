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
        <span v-for="user in item.users.slice(0, 3)" :key="user.id">
          <v-chip
            pill
            color="primary"
            class="ma-1"
            @click="displayMembersDialog(item.users)"
          >
            {{ getMemberName(user) }}
          </v-chip>
        </span>
        <v-chip
          v-if="item.users.length > 3"
          pill
          color="primary"
          outlined
          class="ma-1"
          @click="displayMembersDialog(item.users)"
        >
          {{ `+${item.users.length} total` }}
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
      v-model="selectedGroupUsers"
      :dialog-display-users="dialogDisplayUsers"
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
import Users from '@/components/global/groups/Users.vue';
import GroupUsers from '@/components/global/groups/GroupUsers.vue';

@Component({
  components: {
    DeleteDialog,
    GroupModal,
    Users,
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

  getMemberName(users: ISlimUser): string {
    if(!users.firstName && !users.lastName) {
      return users.email;
    }
    else {
      return `${users.firstName} ${users.lastName}`;
    }
  }

  displayMembersDialog(members: ISlimUser[]) {
    this.selectedGroupUsers = members;
    this.dialogDisplayUsers = true;
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
