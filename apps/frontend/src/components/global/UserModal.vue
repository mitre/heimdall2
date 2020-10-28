<template>
  <v-dialog v-model="dialog" width="75%">
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template #activator="{on}">
      <slot name="clickable" :on="on" />
    </template>

    <v-card>
      <v-card-title class="headline grey" primary-title
        >Update your account information</v-card-title
      >

      <v-card-text>
        <br />
        <v-form>
          <v-row>
            <v-col>
              <v-text-field v-model="userInfo.firstName" label="First Name" />
            </v-col>
            <v-col>
              <v-text-field v-model="userInfo.lastName" label="Last Name" />
            </v-col>
          </v-row>
          <v-text-field v-model="userInfo.email" label="Email" />
          <v-text-field v-model="userInfo.title" label="Title" />
          <v-text-field v-model="userInfo.organization" label="Organization" />
        </v-form>
        <v-divider />
        <v-form>
          <v-text-field
            v-model="userInfo.currentPassword"
            type="password"
            label="Current Password"
          />
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-col>
          <v-btn color="primary" text @click="dialog = false"
            >Close without saving</v-btn
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
import {IUser} from '@heimdall/interfaces';

@Component({})
export default class UserModal extends Vue {
  dialog: boolean = false;

  userInfo: IUser | undefined;
  currentPassword = '';

  async getUserInfo(): Promise<void> {
    ServerModule.UserInfo().then((response) => {
      this.userInfo = response;
    });
  }

  async updateUserInfo(): Promise<void> {
    if (this.userInfo != undefined) {
      const updateUserInfo = {
        ...this.userInfo,
        password: undefined,
        passwordConfirmation: undefined,
        forcePasswordChange: undefined,
        currentPassword: this.currentPassword
      };
      ServerModule.updateUserInfo(updateUserInfo)
        .then(() => {
          SnackbarModule.notify('User updated successfully.');
          this.dialog = false;
        })
        .catch((error) => {
          SnackbarModule.failure(`Failed to update user: ${error}`);
        });
    }
  }

  mounted() {
    this.getUserInfo();
  }
}
</script>
