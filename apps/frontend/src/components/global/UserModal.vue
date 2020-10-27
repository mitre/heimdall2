<template>
  <v-dialog v-model="dialog" width="50%">
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template #activator="{on}">
      <slot name="clickable" :on="on" />
    </template>

    <v-card>
      <v-card-title class="headline grey" primary-title>User Info</v-card-title>

      <v-card-text>
        <br />
        <v-form>
          <v-row>
            <v-col>
              <v-text-field v-model="firstName" label="First Name" />
            </v-col>
            <v-col>
              <v-text-field v-model="lastName" label="Last Name" />
            </v-col>
          </v-row>
          <v-text-field v-model="email" label="Email" />
          <v-text-field v-model="title" label="Title" />
          <v-text-field v-model="organization" label="Organization" />
        </v-form>
        <v-divider />
        <v-form>
          <v-text-field
            v-model="currentPassword"
            type="password"
            label="Current Password"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-col>
          <v-btn color="primary" text @click="dialog = false"
            >Close Window</v-btn
          >
        </v-col>
        <v-col class="text-right">
          <v-btn color="primary" text @click="updateUserInfo"
            >Save Changes</v-btn
          >
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';

@Component({})
export default class UserModal extends Vue {
  dialog: boolean = false;

  firstName: string = '';
  lastName: string = '';
  email: string = '';
  organization: string = '';
  title: string = '';
  currentPassword: string = '';

  async getUserInfo(): Promise<void> {
    ServerModule.UserInfo().then((response) => {
      this.firstName = response.data.firstName;
      this.lastName = response.data.lastName;
      this.email = response.data.email;
      this.organization = response.data.organization;
      this.title = response.data.title;
    });
  }

  async updateUserInfo(): Promise<void> {
    const userInfo = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      organization: this.organization,
      title: this.title,
      currentPassword: this.currentPassword
    };
    ServerModule.updateUserInfo(userInfo)
      .then(() => {
        SnackbarModule.notify('User updated successfully.');
        this.dialog = false;
      })
      .catch((error) => {
        SnackbarModule.failure(`Failed to update user: ${error}`);
      });
  }

  mounted() {
    this.getUserInfo();
  }
}
</script>
