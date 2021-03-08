<template>
  <div>
    <v-row class="mt-0">
      <v-col>
        <v-autocomplete
          v-model="usersToAdd"
          :items="availableUsers"
          chips
          label="Add Users"
          full-width
          hide-selected
          deletable-chips
          multiple
          single-line
        >
          <template slot="append-outer">
            <v-btn @click="addUsers">
              <v-icon left>mdi-plus</v-icon>
              Add
            </v-btn>
          </template>
        </v-autocomplete>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-data-table
          :headers="headers"
          :items="currentUsers"
          :items-per-page="5"
        >
          <template #[`item.full-name`]="{item}"
            >{{ item.firstName }} {{ item.lastName }}</template
          >
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
    <DeleteDialog
      v-model="dialogDelete"
      type="user"
      @cancel="closeDeleteDialog"
      @confirm="deleteUserConfirm"
    />
  </div>
</template>

<script lang="ts">
import {ISlimUser} from '@heimdall/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {VModel} from 'vue-property-decorator';
import {ServerModule} from '@/store/server';
import {IVuetifyItems} from '@/utilities/helper_util';
import DeleteDialog from '@/components/generic/DeleteDialog.vue';

@Component({
  components: {
    DeleteDialog,
  }
})
export default class Users extends Vue {
  @VModel({type: Array, required: false, default() {return []}}) currentUsers!: ISlimUser[];

  usersToAdd: string[] = [];

  editedUser: ISlimUser | null = null;
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
      text: 'Actions',
      value: 'actions',
      sortable: false
    }
  ];

  addUsers() {
    ServerModule.allUsers.forEach((user) => {
      if(this.usersToAdd.includes(user.id)) {
        this.currentUsers.push(user);
      }
    });
    this.usersToAdd = [];
  }

  deleteUserDialog(user: ISlimUser): void {
    this.editedUser = user;
    this.dialogDelete = true
  }

  closeDeleteDialog () {
    this.dialogDelete = false
    this.editedUser = null;
  }

  deleteUserConfirm(): void {
    if (this.editedUser) {
      this.currentUsers.splice(this.currentUsers.indexOf(this.editedUser), 1);
    }
    this.closeDeleteDialog();
  }

  // Filter out users that are already in the group from the user search
  get availableUsers(): IVuetifyItems[] {
    const currentUserIds: string[] = this.currentUsers.map((user) => user.id);
    const users: IVuetifyItems[] = [];

    ServerModule.allUsers.forEach((user) => {
      if(!currentUserIds.includes(user.id)) {
        users.push({
          text: `${user.firstName || ''} ${user.lastName || ''} (${user.email})`,
          value: user.id
        });
      }
    })
    return users;
  }
}
</script>
