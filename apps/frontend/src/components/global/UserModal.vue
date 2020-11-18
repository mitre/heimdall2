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
          <v-text-field
            id="email_field"
            v-model="email"
            :error-messages="emailErrors"
            name="email"
            label="Email"
            type="text"
            required
            @blur="$v.email.$touch()"
          />
          <v-text-field id="title" v-model="userInfo.title" label="Title" />
          <v-text-field
            id="organization"
            v-model="userInfo.organization"
            label="Organization"
          />
          <v-divider />
          <v-text-field
            id="password_field"
            ref="password"
            v-model="currentPassword"
            :error-messages="currentPasswordErrors"
            type="password"
            name="password"
            label="Please provide your current password to save changes to your profile"
            @blur="$v.currentPassword.$touch()"
          />
          <v-btn id="toggleChangePassword" @click="changePasswordDialog"
            >Change Password</v-btn
          >
          <div v-show="changePassword">
            <v-text-field
              id="new_password_field"
              ref="newPassword"
              v-model="newPassword"
              :error-messages="newPasswordErrors"
              type="password"
              name="newPassword"
              label="New Password"
              @blur="$v.newPassword.$touch()"
            />

            <v-text-field
              id="repeat_password_field"
              ref="repeatPassword"
              v-model="passwordConfirmation"
              :error-messages="repeatPasswordErrors"
              type="password"
              name="repeatPassword"
              label="Repeat Password"
              @blur="$v.passwordConfirmation.$touch()"
            />
          </div>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-col>
          <v-btn
            id="closeAndDiscardChanges"
            color="primary"
            text
            @click="dialog = false"
            >Close without saving</v-btn
          >
        </v-col>
        <v-col class="text-right">
          <v-btn
            id="closeAndSaveChanges"
            color="primary"
            text
            @click="updateUserInfo"
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
import {IUser, IUpdateUser} from '@heimdall/interfaces';
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {required, email} from 'vuelidate/lib/validators';

@Component({
  mixins: [UserValidatorMixin],
  validations: {
    email: {
      required,
      email
    },
    currentPassword: {
      required
    },
    newPassword: {
      required
    },
    passwordConfirmation: {
      required
    }
  }
})

export default class UserModal extends Vue {
  dialog: boolean = false;

  userInfo: IUser | null = null;
  email = ServerModule.userInfo.email;
  currentPassword = '';
  changePassword = false;
  newPassword = '';
  passwordConfirmation = '';

  mounted() {
    this.userInfo = {...ServerModule.userInfo};
  }

  async updateUserInfo(): Promise<void> {
    if (this.userInfo != null) {
      var updateUserInfo: IUpdateUser = {
        ...this.userInfo,
        email: this.email,
        password: undefined,
        passwordConfirmation: undefined,
        forcePasswordChange: undefined,
        currentPassword: this.currentPassword
      };
      if(this.changePassword){
        updateUserInfo = {
          ...updateUserInfo,
          password: this.newPassword,
          passwordConfirmation: this.passwordConfirmation,
        }
      }
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
    this.changePassword = !this.changePassword
  }
}
</script>
