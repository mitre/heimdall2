<template>
  <div>
    <div>
      <v-row class="mt-0">
        <v-col>
          <v-autocomplete
            v-if="editable"
            v-model="ownersToAdd"
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
              <v-btn @click="addOwners">
                <v-icon left>mdi-plus</v-icon>
                Add
              </v-btn>
            </template>
          </v-autocomplete>
          <v-autocomplete
            v-if="editable"
            v-model="membersToAdd"
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
              <v-btn @click="addMembers">
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
              @click="editedUser = item"
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
  currentUsers!: ISlimUser[];

  @Prop({type: Boolean, required: false, default: true})
  readonly editable!: boolean;

  membersToAdd: string[] = [];
  ownersToAdd: string[] = [];
  editedUser: ISlimUser = {id: '0', email: ''};
  dialogDelete = false;
  headers: Object[] = [
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

  addMembers() {
    ServerModule.allUsers.forEach((user) => {
      if (this.membersToAdd.includes(user.id)) {
        this.currentUsers.push({
          ...user,
          groupRole: 'member'
        });
      }
      if (this.ownersToAdd.includes(user.id)) {
        this.ownersToAdd.splice(this.ownersToAdd.indexOf(user.id), 1);
      }
    });
    this.membersToAdd = [];
  }

  addOwners() {
    ServerModule.allUsers.forEach((user) => {
      if (this.ownersToAdd.includes(user.id)) {
        this.currentUsers.push({
          ...user,
          groupRole: 'owner'
        });
      }
      if (this.membersToAdd.includes(user.id)) {
        this.membersToAdd.splice(this.membersToAdd.indexOf(user.id), 1);
      }
    });
    this.ownersToAdd = [];
  }

  onUpdateGroupUserRole(newValue: string) {
    // If a role is being changed to member, check that there is at least 1 owner.
    if (newValue === 'member') {
      if (this.numberOfOwners() <= 1) {
        SnackbarModule.failure(`Must have at least 1 owner`);
        return;
      }
    }
    const userToUpdate = this.currentUsers.indexOf(this.editedUser);
    const updatedGroupUser: ISlimUser = {
      ...this.editedUser,
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
    this.editedUser = user;
    this.dialogDelete = true;
  }

  closeActionDialog() {
    this.dialogDelete = false;
    this.editedUser = {id: '0', email: ''};
  }

  deleteUserConfirm(): void {
    if (this.editedUser) {
      this.currentUsers.splice(this.currentUsers.indexOf(this.editedUser), 1);
    }
    this.closeActionDialog();
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
