<template>
  <div>
    <div>
      <v-row class="mt-0">
        <v-col>
          <v-autocomplete
            v-if="editable"
            v-model="usersToAdd['owner']"
            :items="availableUsers"
            chips
            label="Add Owners"
            full-width
            hide-selected
            deletable-chips
            multiple
            single-line
          >
            <template slot="append-outer">
              <v-btn @click="addUsers('owner')">
                <v-icon left>mdi-plus</v-icon>
                Add
              </v-btn>
            </template>
          </v-autocomplete>
          <v-autocomplete
            v-if="editable"
            v-model="usersToAdd['member']"
            :items="availableUsers"
            chips
            label="Add Members"
            full-width
            hide-selected
            deletable-chips
            multiple
            single-line
          >
            <template slot="append-outer">
              <v-btn @click="addUsers('member')">
                <v-icon left>mdi-plus</v-icon>
                Add
              </v-btn>
            </template>
          </v-autocomplete>
        </v-col>
      </v-row>
    </div>
    <v-row>
      <v-col>
        <v-data-table
          :headers="displayedHeaders"
          :items="currentUsers"
          :items-per-page="5"
        >
          <template #[`item.full-name`]="{item}"
            >{{ item.firstName }} {{ item.lastName }}</template
          >
          <template #[`item.groupRole`]="{item}">
            <v-select
              v-if="editable"
              :value="item.groupRole"
              :items="['owner', 'member']"
              @click="editedUserID = item.id"
              @change="onUpdateGroupUserRole"
            />
            <span v-else> {{ item.groupRole }} </span>
          </template>
          <template #[`item.actions`]="{item}">
            <v-icon small title="Delete" @click="deleteUserDialog(item)">
              mdi-delete
            </v-icon>
          </template>
          <template #no-data>
            No users currently added to this group.
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <ActionDialog
      v-model="dialogDelete"
      type="user"
      @cancel="closeActionDialog"
      @confirm="deleteUserConfirm"
    />
  </div>
</template>

<script lang="ts">
import ActionDialog from '@/components/generic/ActionDialog.vue';
import {ISlimUser} from '@heimdall/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, VModel} from 'vue-property-decorator';
import {ServerModule} from '@/store/server';
import {IVuetifyItems} from '@/utilities/helper_util';
import {SnackbarModule} from '../../../store/snackbar';
import {DataTableHeader} from 'vuetify';
import _ from 'lodash';

@Component({
  components: {
    ActionDialog
  }
})
export default class Users extends Vue {
  @VModel({
    type: Array,
    required: false,
    default() {
      return [];
    }
  })
  @Prop({type: Boolean, required: false, default: true})
  readonly editable!: boolean;

  currentUsers!: ISlimUser[];
  editedUserID: string = '0';
  usersToAdd: Record<'member' | 'owner', string[]> = {
    member: [],
    owner: []
  };

  dialogDelete = false;
  headers: DataTableHeader[] = [
    {
      text: 'Name',
      value: 'full-name'
    },
    {
      text: 'Email',
      value: 'email'
    },
    {
      text: 'Title',
      value: 'title'
    },
    {
      text: 'Role',
      value: 'groupRole'
    }
  ];

  get displayedHeaders() {
    // If the user is editing the group, then display the actions column.
    if (this.editable) {
      this.headers.push({
        text: 'Actions',
        value: 'actions',
        sortable: false
      });
    }
    return this.headers;
  }

  addUsers(role: 'member' | 'owner') {
    return () => {
      for (const user of ServerModule.allUsers) {
        if (this.usersToAdd[role].includes(user.id)) {
          this.currentUsers.push({
            ...user,
            groupRole: role
          });
        }
        for (const users of Object.values(
          _.omit(this.usersToAdd, role) as Record<'member' | 'owner', string[]>
        )) {
          const index = users.indexOf(user.id);
          if (index !== -1) {
            users.splice(index, 1);
          }
        }
      }
      this.usersToAdd[role] = [];
    };
  }

  onUpdateGroupUserRole(newValue: string) {
    // If a role is being changed to member, check that there is at least 1 owner.
    if (newValue === 'member') {
      if (this.numberOfOwners() <= 1) {
        SnackbarModule.failure(`Must have at least 1 owner`);
        return;
      }
    }
    const editedUser = this.getEditedUser();
    const userToUpdate = this.currentUsers.indexOf(editedUser);
    const updatedGroupUser: ISlimUser = {
      ...editedUser,
      groupRole: newValue
    };
    this.currentUsers[userToUpdate] = updatedGroupUser;
  }

  numberOfOwners(): number {
    let numberOfOwners = 0;
    this.currentUsers.forEach((user) => {
      if (user.groupRole === 'owner') {
        ++numberOfOwners;
      }
    });
    return numberOfOwners;
  }

  deleteUserDialog(user: ISlimUser): void {
    this.editedUserID = user.id;
    this.dialogDelete = true;
  }

  closeActionDialog() {
    this.dialogDelete = false;
    this.editedUserID = '0';
  }

  deleteUserConfirm(): void {
    if (this.editedUserID !== '0') {
      this.currentUsers.splice(
        this.currentUsers.indexOf(this.getEditedUser()),
        1
      );
    }
    this.closeActionDialog();
  }

  getEditedUser(): ISlimUser {
    return (
      this.currentUsers.find((user) => user.id === this.editedUserID) || {
        id: '0',
        email: ''
      }
    );
  }

  // Filter out users that are already in the group from the user search
  get availableUsers(): IVuetifyItems[] {
    const currentUserIds: string[] = this.currentUsers.map((user) => user.id);
    const users: IVuetifyItems[] = [];
    ServerModule.allUsers.forEach(async (user) => {
      if (
        !currentUserIds.includes(user.id) &&
        user.id !== ServerModule.userInfo.id
      ) {
        users.push({
          text: `${user.firstName || ''} ${user.lastName || ''} (${
            user.email
          })`,
          value: user.id
        });
      }
    });
    return users;
  }
}
</script>
