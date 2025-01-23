<template>
  <div>
    <div>
      <v-row class="mt-0">
        <v-col>
          <v-autocomplete
            v-if="editable"
            v-model="usersToAdd"
            :items="availableUsers"
            chips
            label="Add Users"
            full-width
            hide-selected
            deletable-chips
            multiple
            single-line
            @blur="addUsers"
          />
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
          <template #[`item.full-name`]="{item}">
            {{ item.firstName }} {{ item.lastName }}
          </template>
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
import {ISlimUser} from '@heimdall/common/interfaces';
import Component from 'vue-class-component';
import {Emit, Prop, VModel} from 'vue-property-decorator';
import {ServerModule} from '@/store/server';
import {IVuetifyItems} from '@/utilities/helper_util';
import {DataTableHeader} from 'vuetify';
import Vue from 'vue';

@Component({
  components: {
    ActionDialog
  }
})
export default class Users extends Vue {
  @VModel({
    type: Array,
    required: false,
    default(): ISlimUser[] {
      return [];
    }
  })
  currentUsers!: ISlimUser[];

  @Prop({type: Boolean, required: false, default: true})
  readonly editable!: boolean;

  @Prop({type: Boolean, required: false, default: false})
  readonly create!: boolean;

  @Prop({type: Boolean, required: false, default: false})
  readonly admin!: boolean;

  editedUserID: string = '0'; // Default to '0', as the id indices start at '1'
  usersToAdd: string[] = [];

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

  addUsers() {
    ServerModule.allUsers.forEach((user) => {
      if (this.usersToAdd.includes(user.id)) {
        this.currentUsers.push({
          ...user,
          groupRole: 'member'
        });
      }
    });
    this.usersToAdd = [];
  }

  @Emit()
  onUpdateGroupUserRole(newRole: string) {
    let saveable = true;
    // If a role is being changed to member, check that there is at least 1 owner.
    const editedUser = this.getEditedUser();
    const userToUpdate = this.currentUsers.indexOf(editedUser);
    const updatedGroupUser: ISlimUser = {
      ...editedUser,
      groupRole: newRole
    };
    this.currentUsers[userToUpdate] = updatedGroupUser;

    if (this.numberOfOwners() < 1) {
      saveable = false;
    }
    return saveable;
  }

  numberOfOwners(): number {
    return this.currentUsers.filter((user) => user.groupRole === 'owner')
      .length;
  }

  deleteUserDialog(user: ISlimUser): void {
    this.editedUserID = user.id;
    this.dialogDelete = true;
  }

  closeActionDialog() {
    this.dialogDelete = false;
    this.editedUserID = '0';
  }

  @Emit()
  deleteUserConfirm(): boolean {
    let saveable = true;
    const userToDelete = this.currentUsers.indexOf(this.getEditedUser());
    if (
      this.currentUsers[userToDelete].groupRole === 'owner' &&
      this.numberOfOwners() < 2
    ) {
      saveable = false;
    }
    if (this.editedUserID !== '0') {
      this.currentUsers.splice(userToDelete, 1);
    }
    this.onUpdateGroupUserRole('');
    this.closeActionDialog();
    return saveable;
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
    for (const user of ServerModule.allUsers) {
      if (
        !currentUserIds.includes(user.id) &&
        (user.id !== ServerModule.userInfo.id || this.admin || !this.create)
      ) {
        users.push({
          text: `${user.firstName || ''} ${user.lastName || ''} (${
            user.email
          })`,
          value: user.id
        });
      }
    }
    return users;
  }
}
</script>
