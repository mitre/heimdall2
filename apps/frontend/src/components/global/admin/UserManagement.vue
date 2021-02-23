<template>
  <v-card>
    <v-card-title>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Search"
        single-line
        hide-details
      />
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
    <v-dialog v-model="dialogDelete" max-width="500px">
      <v-card>
        <v-card-title class="headline"
          >Are you sure you want to delete this user?</v-card-title
        >
        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="closeDeleteDialog"
            >Cancel</v-btn
          >
          <v-btn color="blue darken-1" text @click="deleteUserConfirm"
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
import {IUser} from '@heimdall/interfaces';
import axios from 'axios';
import Vue from 'vue';
import Component from 'vue-class-component';
import UserModal from '@/components/global/UserModal.vue';

@Component({
  components: {
    UserModal
  }
})
export default class UserManagement extends Vue {
  loading: boolean = true;
  editedUser: IUser | null = null;
  dialogDelete = false;
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
      }).catch((err) => {
        // If the backend provided an error then show it, otherwise fallback to printing the client side error
        SnackbarModule.failure(err?.response?.data?.message || `${err}. Please reload the page and try again.`);
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
      .catch((err) => {
        SnackbarModule.failure(`${err}. Please reload the page and try again.`);
      })
      .finally(() => {
        this.loading = false;
      });
  }
}
</script>
