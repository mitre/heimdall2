<template>
  <v-dialog v-model="dialog" width="75%">
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template #activator="{on, attrs}">
      <slot name="clickable" :on="on" :attrs="attrs" />
    </template>

    <v-card>
      <v-card-title id="userModalTitle" class="headline grey" primary-title>{{
        title
      }}</v-card-title>
      <v-card-text v-if="userInfo === null">
        <v-progress-linear indeterminate color="white" class="mb-0" />
      </v-card-text>
      <v-card-text v-else>
        <br />
        <v-form data-cy="updateUserForm">
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
          <v-row>
            <v-col>
              <v-text-field
                id="email_field"
                v-model="userInfo.email"
                :error-messages="emailErrors($v.userInfo.email)"
                label="Email"
                type="text"
                required
                @blur="$v.userInfo.email.$touch()"
              />
            </v-col>
            <v-col v-if="admin">
              <v-select v-model="userInfo.role" :items="roles" label="Role" />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-text-field id="title" v-model="userInfo.title" label="Title" />
            </v-col>
            <v-col>
              <v-text-field
                id="organization"
                v-model="userInfo.organization"
                label="Organization"
              />
            </v-col>
          </v-row>

          <div v-if="!admin">
            <v-divider />
            <v-text-field
              id="password_field"
              ref="password"
              v-model="currentPassword"
              :error-messages="
                requiredFieldError($v.currentPassword, 'Current Password')
              "
              type="password"
              label="Please provide your current password to save changes to your profile"
              @blur="$v.currentPassword.$touch()"
            />
          </div>
          <v-btn id="toggleChangePassword" @click="changePasswordDialog"
            >Change Password</v-btn
          >
          <div v-show="changePassword">
            <v-text-field
              id="new_password_field"
              ref="newPassword"
              v-model="newPassword"
              :error-messages="
                requiredFieldError($v.newPassword, 'New Password')
              "
              type="password"
              label="New Password"
              @blur="$v.newPassword.$touch()"
            />

            <v-text-field
              id="repeat_password_field"
              ref="repeatPassword"
              v-model="passwordConfirmation"
              :error-messages="
                requiredFieldError($v.passwordConfirmation, 'Repeat Password')
              "
              type="password"
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
import {required, email, requiredIf, requiredUnless} from 'vuelidate/lib/validators';
import {Prop} from 'vue-property-decorator';

@Component({
  mixins: [UserValidatorMixin],
  validations: {
    userInfo: {
      email: {
        required,
        email
      }
    },
    currentPassword: {
      required: requiredUnless('admin')
    },
    newPassword: {
      required: requiredIf('changePassword')
    },
    passwordConfirmation: {
      required: requiredIf('changePassword')
    }
  }
})

export default class UserModal extends Vue {
  @Prop({type: Object, required: true}) readonly user!: IUser;
  @Prop({type: Boolean, default: false}) readonly admin!: boolean;

  roles: string[] = ['user', 'admin'];

  dialog: boolean = false;
  changePassword: boolean = false;

  userInfo: IUser = {...this.user};
  currentPassword: string = '';
  newPassword: string = '';
  passwordConfirmation: string = '';

  async updateUserInfo(): Promise<void> {
    this.$v.$touch()
    if (this.userInfo != null && !this.$v.$invalid) {
      var updateUserInfo: IUpdateUser = {
        ...this.userInfo,
        password: undefined,
        passwordConfirmation: undefined,
        forcePasswordChange: undefined,
      };
      if(!this.admin) {
        updateUserInfo = {
          ...updateUserInfo,
          currentPassword: this.currentPassword,
        }
      }
      if(this.changePassword){
        updateUserInfo = {
          ...updateUserInfo,
          password: this.newPassword,
          passwordConfirmation: this.passwordConfirmation,
        }
      }
      ServerModule.updateUserInfo({id: this.user.id, info: updateUserInfo})
        .then((data) => {
          SnackbarModule.notify('User updated successfully.');
          this.$emit('update-user', data);
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

  get title(): string {
    if(this.admin) {
      return `Update account information for ${this.user.email}`
    } else {
      return 'Update your account information'
    }
  }
}
</script>
