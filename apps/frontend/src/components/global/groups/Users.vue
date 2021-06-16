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
          <template #[`item.groupRole`]="{item}">
            {{ item.groupRole }}
            <v-menu offset-x>
              <template #activator="{on}">
                <v-icon
                  small
                  title="Edit Role"
                  v-on="on"
                  @click="getUsersCurrentRole(item.groupRole)"
                >
                  mdi-pencil
                </v-icon>
              </template>
              <v-list>
                <v-list-item-group
                  v-model="currentRole"
                  active-class="bg-active"
                >
                  <v-list-item
                    v-for="(role, index) in roles"
                    :key="index"
                    ripple
                    @click="editUserRole(item, groupId, role.value)"
                  >
                    <v-list-item-title>{{ role.text }}</v-list-item-title>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-menu>
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
import {Prop, VModel} from 'vue-property-decorator';
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
  @Prop({type: String, required: false}) readonly groupId!: string;

  usersToAdd: string[] = [];

  deletedUser: ISlimUser | null = null;
  editUser: ISlimUser | null = null;
  dialogDelete = false;
  currentRole = 0;

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
    },
    {
      text: 'Actions',
      value: 'actions',
      sortable: false
    }
  ];

  roles: Object[] = [
    {
      text: 'Owner',
      value: 'owner'
    },
    {
      text: 'Member',
      value: 'member'
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
    this.deletedUser = user;
    this.dialogDelete = true
  }

  closeDeleteDialog () {
    this.dialogDelete = false
    this.deletedUser = null;
  }

  deleteUserConfirm(): void {
    if (this.deletedUser) {
      this.currentUsers.splice(this.currentUsers.indexOf(this.deletedUser), 1);
    }
    this.closeDeleteDialog();
  }

  getUsersCurrentRole(currentRole: string) {
    if(currentRole === 'owner') {
      this.currentRole = 0;
    }
    else {
      this.currentRole = 1;
    }
  }

  test(test: ISlimUser[]) {
    for(let i = 0; i < test.length; i++) {
      console.log("User: " + this.currentUsers[i].email + " Role: " + this.currentUsers[i].groupRole);
    }
  }

  editUserRole(user: ISlimUser, groupId: string, updatedRole: string,) {
    if(user.groupRole !== updatedRole) {
      const updatedUser: ISlimUser = {
        ...user,
        groupRole: updatedRole
      }
      this.$emit('edit-user-group-role', updatedUser);
      this.currentUsers[this.currentUsers.indexOf(user)] = updatedUser;
    }
  }

  // Filter out users that are already in the group from the user search
  get availableUsers(): IVuetifyItems[] {
    const currentUserIds: string[] = this.currentUsers.map((user) => user.id);
    const users: IVuetifyItems[] = [];

    ServerModule.allUsers.forEach(async (user) => {
      if(!currentUserIds.includes(user.id) && user.id !== ServerModule.userInfo.id) {
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
