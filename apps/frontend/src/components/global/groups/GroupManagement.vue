<template>
  <v-card>
    <v-card-title class="pb-0">
      <GroupModal
        id="groupModal"
        :create="true"
      >
        <template #clickable="{on, attrs}">
          <v-btn
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
      :headers="groupsHeaders"
      :items="groupData"
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
      <template #[`item.members`]="{item}">
        <span
          v-for="user in item.members.slice(0, 3)"
          :key="user.id"
        >
          <v-chip
            pill
            color="primary"
            class="ma-1"
            @click="displayUsersDialog(item.members)"
          >
            {{ getMemberName(user) }}
          </v-chip>
        </span>
        <v-chip
          v-if="item.members.length > 3"
          pill
          color="primary"
          outlined
          class="ma-1"
          @click="displayUsersDialog(item.members)"
        >
          {{ `+${item.members.length - 3} more` }}
        </v-chip>
      </template>
      <template #[`item.owners`]="{item}">
        <span
          v-for="user in item.owners.slice(0, 3)"
          :key="user.id"
        >
          <v-chip
            pill
            color="primary"
            class="ma-1"
            @click="displayUsersDialog(item.owners)"
          >
            {{ getMemberName(user) }}
          </v-chip>
        </span>
        <v-chip
          v-if="item.owners.length > 3"
          pill
          color="primary"
          outlined
          class="ma-1"
          @click="displayUsersDialog(item.owners)"
        >
          {{ `+${item.owners.length - 3} more` }}
        </v-chip>
      </template>
      <template #[`item.actions`]="{item}">
        <v-tooltip
          color="secondary"
          left
        >
          <template #activator="{on}">
            <v-icon
              small
              title="Info"
              data-cy="info"
              class="mr-2"
              v-on="on"
            >
              mdi-information
            </v-icon>
          </template>
          <v-card
            color="transparent"
            flat
            max-width="600px"
            overflow-y-auto
          >
            <span>
              <v-card-title>{{ item.name }}</v-card-title>
              <v-card-text>
                <div>Visibility: {{ item.public ? 'Public' : 'Private' }}</div>
                <div>Created At: {{ item.createdAt }}</div>
                <div>Updated At: {{ item.updatedAt }}</div>
              </v-card-text>
              <v-card-subtitle>
                <strong>Group Description</strong>
              </v-card-subtitle>
              <v-card-text v-if="item.desc !== ''">
                <div
                  v-for="(line, index) in item.desc.split('\n')"
                  :key="index"
                >
                  {{ line }} <br>
                </div>
              </v-card-text>
              <v-card-text v-else>None</v-card-text>
            </span>
          </v-card>
        </v-tooltip>
        <span v-if="item.role === 'owner' || adminPanel">
          <GroupModal
            id="editGroupModal"
            :create="false"
            :admin="adminPanel"
            :group="item"
          >
            <template #clickable="{on}">
              <v-icon
                small
                title="Edit"
                data-cy="edit"
                class="mr-2"
                v-on="on"
              >
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
        </span>
      </template>
      <template #no-data>
        No groups match current selection.
      </template>
    </v-data-table>
    <ActionDialog
      v-model="dialogDelete"
      type="group"
      @cancel="closeActionDialog"
      @confirm="deleteGroupConfirm"
    />
    <GroupUsers
      v-model="selectedGroupUsers"
      :dialog-display-users="dialogDisplayUsers"
      @close-group-users-dialog="dialogDisplayUsers = false"
    />
  </v-card>
</template>

<script lang="ts">
import type { IGroup, ISlimUser } from '@heimdall/common/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ActionDialog from '@/components/generic/ActionDialog.vue';
import GroupModal from '@/components/global/groups/GroupModal.vue';
import GroupUsers from '@/components/global/groups/GroupUsers.vue';
import Users from '@/components/global/groups/Users.vue';
import { GroupsModule } from '@/store/groups';
import { SnackbarModule } from '@/store/snackbar';

@Component({
  components: {
    ActionDialog,
    GroupModal,
    GroupUsers,
    Users,
  },
})
export default class GroupManagement extends Vue {
  @Prop({ default: false, type: Boolean }) readonly adminPanel!: boolean;

  dialogDelete = false;
  dialogDisplayUsers = false;
  editedGroup: IGroup | null = null;
  groupsHeaders: {
    align?: string;
    sortable?: boolean;
    text: string;
    value: string;
  }[] = [
    {
      sortable: true,
      text: 'ID',
      value: 'id',
    },
    {
      align: 'start',
      sortable: true,
      text: 'Group Name',
      value: 'name',
    },
    {
      sortable: true,
      text: 'Public',
      value: 'public',
    },
    { sortable: true, text: 'Your Role', value: 'role' },
    { sortable: true, text: 'Owners', value: 'owners' },
    { sortable: true, text: 'Members', value: 'members' },
    { sortable: false, text: 'Actions', value: 'actions' },
  ];

  search = '';

  selectedGroupUsers: ISlimUser[] | null = [];

  get groupData(): (IGroup & { members: ISlimUser[]; owners: ISlimUser[] })[] {
    let groups: IGroup[];
    groups = this.adminPanel
      ? [...GroupsModule.myGroups, ...GroupsModule.allGroups.filter(
        group =>
          !GroupsModule.myGroups
            .map(myGroup => myGroup.id)
            .includes(group.id),
      )]
      : GroupsModule.myGroups;
    return groups.map((group) => {
      return {
        ...group,
        members: group.users.filter(user => user.groupRole === 'member'),
        owners: group.users.filter(user => user.groupRole === 'owner'),
      };
    });
  }

  get loading(): boolean {
    return GroupsModule.loading;
  }

  closeActionDialog() {
    this.dialogDelete = false;
    this.editedGroup = null;
  }

  deleteGroupConfirm(): void {
    if (this.editedGroup) {
      GroupsModule.DeleteGroup(this.editedGroup)
        .then((data) => {
          SnackbarModule.notify(`Successfully deleted group ${data.name}`);
        })
        .finally(() => {
          this.closeActionDialog();
        });
    }
  }

  deleteGroupDialog(group: IGroup): void {
    this.editedGroup = group;
    this.dialogDelete = true;
  }

  displayUsersDialog(members: ISlimUser[]) {
    this.selectedGroupUsers = members;
    this.dialogDisplayUsers = true;
  }

  getMemberName(users: ISlimUser): string {
    return !users.firstName && !users.lastName ? users.email : `${users.firstName}${users.lastName ? ' ' + users.lastName : ''}`;
  }
}
</script>
