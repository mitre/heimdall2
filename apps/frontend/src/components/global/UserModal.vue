<template>
  <v-dialog v-model="dialog" width="75%">
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template #activator="{on, attrs}">
      <slot name="clickable" :on="on" :attrs="attrs" />
    </template>
    <v-banner v-if="update_unavailable" icon="mdi-alert" color="warning">
      Some of the settings are managed by your identity provider.
    </v-banner>
    <v-card class="rounded-t-0">
      <v-card-title
        data-cy="userModalTitle"
        class="headline grey"
        primary-title
        >{{ title }}</v-card-title
      >
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
                :disabled="update_unavailable"
                label="First Name"
              />
            </v-col>
            <v-col>
              <v-text-field
                id="lastName"
                v-model="userInfo.lastName"
                :disabled="update_unavailable"
                label="Last Name"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-text-field
                id="email_field"
                v-model="userInfo.email"
                :disabled="update_unavailable"
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
              <v-text-field
                id="title"
                v-model="userInfo.title"
                :disabled="update_unavailable"
                label="Title"
              />
            </v-col>
            <v-col>
              <v-text-field
                id="organization"
                v-model="userInfo.organization"
                :disabled="update_unavailable"
                label="Organization"
              />
            </v-col>
          </v-row>

          <div v-show="showAPIKeys">
            <div
              class="d-flex flex-row-reverse"
              style="cursor: pointer"
              @click="addAPIKey"
            >
              <v-icon>mdi-plus</v-icon>
            </div>
            <ActionDialog
              v-model="deleteAPIKeyDialog"
              type="API Key"
              @cancel="deleteAPIKeyDialog = false"
              @confirm="deleteAPIKeyConfirm"
            />
            <ActionDialog
              v-model="refreshAPIKeyDialog"
              action="refresh"
              type="API Key"
              @cancel="refreshAPIKeyDialog = false"
              @confirm="refreshAPIKeyConfirm"
            />
            <v-data-table
              :headers="apiKeyHeaders"
              :items="apiKeys"
              dense
              style="max-height: 300px"
              class="overflow-y-auto"
            >
              <template #[`item.name`]="{item}"
                ><v-text-field v-model="item.name" @change="updateAPIKey(item)"
              /></template>
              <template #[`item.apiKey`]="{item}">{{
                truncate(item.apiKey) || 'Only Shown on Creation'
              }}</template>
              <template #[`item.action`]="{item}"
                ><CopyButton v-if="item.apiKey" :text="item.apiKey" />
                <v-icon class="mr-2" small @click="refreshAPIKey(item)"
                  >mdi-refresh</v-icon
                >
                <v-icon class="mr-2" small @click="deleteAPIKey(item)"
                  >mdi-delete</v-icon
                ></template
              >
            </v-data-table>
          </div>

          <div v-if="!admin && userInfo.creationMethod === 'local'">
            <v-divider />
            <v-text-field
              id="password_field"
              ref="password"
              v-model="currentPassword"
              :disabled="update_unavailable"
              :error-messages="
                requiredFieldError($v.currentPassword, 'Current Password')
              "
              type="password"
              label="Please provide your current password to make changes to your profile"
              @blur="$v.currentPassword.$touch()"
            />
          </div>
          <v-btn
            v-if="userInfo.creationMethod === 'local'"
            id="toggleChangePassword"
            :disabled="update_unavailable"
            @click="changePasswordDialog"
            >Change Password</v-btn
          >
          <v-btn
            v-if="!admin"
            id="toggleAPIKeys"
            class="ml-2"
            :disabled="currentPassword === ''"
            @click="toggleShowAPIKeys"
            >Show API Keys</v-btn
          >
          <div v-show="changePassword">
            <v-text-field
              id="new_password_field"
              ref="newPassword"
              v-model="newPassword"
              :disabled="update_unavailable"
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
              :disabled="update_unavailable"
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
            :disabled="update_unavailable"
            :loading="buttonLoading"
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
import {IUser, IUpdateUser, IApiKey} from '@heimdall/interfaces';
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {required, email, requiredIf} from 'vuelidate/lib/validators';
import {Prop} from 'vue-property-decorator';
import axios from 'axios';
import ActionDialog from '@/components/generic/ActionDialog.vue';
import _ from 'lodash';
import CopyButton from '@/components/generic/CopyButton.vue'


@Component({
  components: {ActionDialog, CopyButton},
  mixins: [UserValidatorMixin],
  validations: {
    userInfo: {
      email: {
        required,
        email
      }
    },
    currentPassword: {
      required: requiredIf(function(userInfo){
        	return (userInfo.user.role == 'admin')
        })
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

  showAPIKeys = false
  apiKeyHeaders = [{
      text: 'Name',
      value: 'name',
      filterable: true,
      width: '20%',
      align: 'start'
    },
    {
      text: 'Value',
      value: 'apiKey',
      sortable: false
    },
    {
      text: 'Action',
      value: 'action',
      sortable: false
    }
  ]

  apiKeys: IApiKey[] = [];
  activeAPIKey: IApiKey | null = null
  deleteAPIKeyDialog = false;
  refreshAPIKeyDialog = false;

  dialog = false;
  changePassword = false;

  userInfo: IUser = {...this.user};
  currentPassword = '';
  newPassword = '';
  passwordConfirmation = '';
  buttonLoading = false;

  mounted() {
    if(!this.admin) {
      this.getAPIKeys()
    }
  }

  async updateUserInfo(): Promise<void> {
    this.buttonLoading = true;
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
        }).finally(() => {
          this.buttonLoading = false;
        })
    }
  }

  truncate(str: string) {
    return _.truncate(str, {length: 80})
  }

  changePasswordDialog() {
    this.changePassword = !this.changePassword
  }

  toggleShowAPIKeys() {
    this.showAPIKeys = !this.showAPIKeys
  }

  getAPIKeys() {
    axios.get<IApiKey[]>(`/apikeys`).then(({data}) => {
      this.apiKeys = data
    })
  }

  addAPIKey() {
    axios.post<IApiKey>(`/apikeys`, {name: '', currentPassword: this.currentPassword}).then(({data}) => this.apiKeys.push(data))
  }

  refreshAPIKey(keyToRefresh: IApiKey) {
    this.activeAPIKey = keyToRefresh;
    this.refreshAPIKeyDialog = true
  }

  deleteAPIKey(keyToDelete: IApiKey) {
    this.activeAPIKey = keyToDelete;
    this.deleteAPIKeyDialog = true
  }

  deleteAPIKeyConfirm() {
    if(this.activeAPIKey) {
      axios.delete<IApiKey>(`/apikeys/${this.activeAPIKey.id}`, {
        data: {
          currentPassword: this.currentPassword
        }
      }).then(({data}) => {
        this.apiKeys = this.apiKeys.filter((key) => key.id !== data.id)
      })
    }
    this.deleteAPIKeyDialog = false;
  }

  updateAPIKey(item: IApiKey) {
    axios.patch(`/apikeys/${item.id}`, {...item, currentPassword: this.currentPassword})
  }

  refreshAPIKeyConfirm() {
    axios.put(`/apikeys/${this.activeAPIKey?.id}`, {currentPassword: this.currentPassword}).then(({data}) => {
      this.apiKeys = this.apiKeys.map((key) => {
        if(key.id === this.activeAPIKey?.id) {
          return {...key, apiKey: data.key}
        } else {
          return key
        }
      })
    })
    this.refreshAPIKeyDialog = false;
  }

  get update_unavailable() {
    return this.userInfo.creationMethod == 'ldap' || ServerModule.enabledOAuth.includes(this.userInfo.creationMethod);
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
