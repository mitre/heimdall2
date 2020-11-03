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
      <v-card-text v-if="userInfo === null">
        <v-progress-linear indeterminate color="white" class="mb-0" />
      </v-card-text>
      <v-card-text v-else>
        <br />
        <v-form>
          <v-row>
            <v-col>
              <v-text-field
                id="firstName"
                v-model="userInfo.firstName"
                label="First Name"
              />
            </v-col>
            <v-col>
              <v-text-field
                id="lastName"
                v-model="userInfo.lastName"
                label="Last Name"
              />
            </v-col>
          </v-row>
          <v-text-field id="email" v-model="userInfo.email" label="Email" />
          <v-text-field id="title" v-model="userInfo.title" label="Title" />
          <v-text-field
            id="organization"
            v-model="userInfo.organization"
            label="Organization"
          />
        </v-form>
        <v-divider />
        <v-form>
          <v-text-field
            v-model="currentPassword"
            type="password"
            label="Current Password"
          />
          <v-btn @click="changePasswordDialog">Change Password</v-btn>
          <div v-if="changePassword">
            <v-text-field
              v-model="newPassword"
              type="password"
              label="New Password"
            >
              <template #progress>
                <v-progress-linear
                  :value="passwordStrengthPercent"
                  :color="passwordStrengthColor"
                  absolute
                  height="7"
                />
              </template>
            </v-text-field>

            <v-text-field
              v-model="passwordConfirmation"
              type="password"
              label="Confirm Password"
            />
          </div>
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

  userInfo: IUser | null = null;
  currentPassword = '';
  changePassword = false;
  newPassword: string | undefined = undefined;
  passwordConfirmation: string | undefined = undefined;

  async getUserInfo(): Promise<void> {
    ServerModule.UserInfo().then((response) => {
      this.userInfo = response;
    });
  }

  async updateUserInfo(): Promise<void> {
    if (this.userInfo != null) {
      var updateUserInfo = {
        ...this.userInfo,
        password: this.newPassword,
        passwordConfirmation: this.passwordConfirmation,
        forcePasswordChange: undefined,
        currentPassword: this.currentPassword
      };

      ServerModule.updateUserInfo(updateUserInfo)
        .then(() => {
          SnackbarModule.notify('User updated successfully.');
          this.dialog = false;
        })
        .catch((error) => {
          SnackbarModule.notify(error.response.data.message);
          if (typeof error.response.data.message === 'object') {
            SnackbarModule.notify(
              error.response.data.message
                .map(function capitalize(c: string) {
                  return c.charAt(0).toUpperCase() + c.slice(1);
                })
                .join(', ')
            );
          } else {
            SnackbarModule.notify(error.response.data.message);
          }
        });
    }
  }

  changePasswordDialog() {
    if (!this.changePassword) {
      this.newPassword = '';
      this.passwordConfirmation = '';
      this.changePassword = true;
    } else {
      this.newPassword = undefined;
      this.passwordConfirmation = undefined;
      this.changePassword = false;
    }
  }

  mounted() {
    this.getUserInfo();
  }
}
</script>
