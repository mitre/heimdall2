<template>
  <div>
    <RegistrationModal
      :admin-register-mode="true"
      :visible="createUserDialog"
      @close-modal="createUserDialog = false; getUsers()"
    />
    <v-card>
      <v-card-title>
        <v-row>
          <v-col cols="10">
            <v-text-field
              v-model="search"
              append-icon="mdi-magnify"
              label="Search"
              single-line
              hide-details
            />
          </v-col>
          <v-col cols="2" class="text-center mt-3">
            <v-btn 
              color="primary"
              @click="createUserDialog = true" 
              max-width="100%"
            >
              Add New User
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="users"
        class="elevation-1"
        :loading="loading"
        :search="search"
      >
        <template #[`item.actions`]="{item}">
          <UserModal
            id="adminUserEditModal"
            :user="item"
            :admin="true"
            @update-user="updateUser"
          >
            <template #clickable="{on}"
              ><v-icon small title="Edit" class="mr-2" v-on="on">
                mdi-pencil
              </v-icon>
            </template>
          </UserModal>
          <v-icon small title="Delete" @click="deleteUserDialog(item)">
            mdi-delete
          </v-icon>
        </template>
        <template #no-data>
          <v-btn color="primary" @click="initialize"> Reset </v-btn>
        </template>
      </v-data-table>
      <DeleteDialog
        v-model="dialogDelete"
        type="user"
        @cancel="closeDeleteDialog"
        @confirm="deleteUserConfirm"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import {SnackbarModule} from '@/store/snackbar';
import {IUser} from '@heimdall/interfaces';
import axios from 'axios';
import Vue from 'vue';
import Component from 'vue-class-component';
import UserModal from '@/components/global/UserModal.vue';
import DeleteDialog from '@/components/generic/DeleteDialog.vue';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import RegistrationModal from '@/components/global/RegistrationModal.vue';

@Component({
  components: {
    DeleteDialog,
    UserModal,
    LinkItem,
    RegistrationModal
  }
})
export default class UserManagement extends Vue {
  loading: boolean = true;
  editedUser: IUser | null = null;
  dialogDelete = false;
  createUserDialog = false;
  search = '';
  users: IUser[] = [];
  headers: Object[] = [
    {
      text: 'Email',
      align: 'start',
      sortable: true,
      value: 'email'
    },
    {text: 'First Name', value: 'firstName', sortable: true},
    {text: 'Last Name', value: 'lastName', sortable: true},
    {text: 'Role', value: 'role', sortable: true},
    {text: 'Last Login', value: 'lastLogin', sortable: true},
    {text: 'Actions', value: 'actions', sortable: false},
  ];

  mounted() {
    this.getUsers();
  }

  deleteUserDialog(user: IUser): void {
    this.editedUser = user;
    this.dialogDelete = true
  }

  deleteUserConfirm(): void {
    if (this.editedUser) {
      axios.delete<IUser>(`/users/${this.editedUser.id}`).then((response) => {
        SnackbarModule.notify(`Successfully deleted user ${response.data.email}`);
      }).finally(() => {
        this.getUsers();
        this.closeDeleteDialog();
      });
    }
  }

  closeDeleteDialog () {
    this.dialogDelete = false
    this.editedUser = null;
  }

  updateUser(updatedUser: IUser) {
    const id = this.users.findIndex(user => user.id === updatedUser.id);
    if (id !== -1) {
      this.$set(this.users, id, updatedUser);
    }
  }

  getUsers(): void {
    axios
      .get<IUser[]>('/users')
      .then((response) => {
        this.users = response.data;
      })
      .finally(() => {
        this.loading = false;
      });
  }
}
</script>
