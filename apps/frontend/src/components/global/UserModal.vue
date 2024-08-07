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
                aria-autocomplete="both"
                autocomplete="given-name"
              />
            </v-col>
            <v-col>
              <v-text-field
                id="lastName"
                v-model="userInfo.lastName"
                :disabled="update_unavailable"
                label="Last Name"
                aria-autocomplete="both"
                autocomplete="family-name"
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
                type="email"
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
              <span class="pt-1">Add API Key</span>
              <v-icon>mdi-plus</v-icon>
            </div>
            <InputDialog
              :show-modal="inputPasswordDialog"
              title="Please enter your current password to update API keys"
              text-field-label="Current Password"
              :is-password="true"
              @update-value="updateCurrentPassword"
              @cancel="inputPasswordDialog = false"
              @confirm="updateCallback"
            />
            <v-data-table
              :headers="apiKeyHeaders"
              :items="apiKeys"
              :loading="apiKeyTableLoading"
              dense
              style="max-height: 300px"
              class="overflow-y-auto"
            >
              <template #[`item.name`]="{item}"
                ><v-text-field v-model="item.name" @change="updateAPIKey(item)"
              /></template>
              <template #[`item.apiKey`]="{item}"
                ><span class="break-lines">{{
                  item.apiKey || 'Only Shown on Creation'
                }}</span></template
              >
              <template #[`item.action`]="{item}">
                <v-tooltip left>
                  <template #activator="{on, attrs}">
                    <v-icon
                      class="mr-2"
                      small
                      v-bind="attrs"
                      @click="refreshAPIKey(item)"
                      v-on="on"
                      >mdi-refresh</v-icon
                    >
                  </template>
                  <span>Recreate this API Key</span>
                </v-tooltip>
                <v-tooltip top>
                  <template #activator="{on, attrs}">
                    <span v-bind="attrs" v-on="on">
                      <CopyButton v-if="item.apiKey" :text="item.apiKey" />
                    </span>
                  </template>
                  <span>Copy this API Key</span>
                </v-tooltip>

                <v-tooltip right>
                  <template #activator="{on, attrs}">
                    <v-icon
                      class="mr-2"
                      small
                      v-bind="attrs"
                      @click="deleteAPIKey(item)"
                      v-on="on"
                      >mdi-delete</v-icon
                    >
                  </template>
                  <span>Delete this API Key</span>
                </v-tooltip>
              </template>
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
            v-if="apiKeysEnabled"
            id="toggleAPIKeys"
            class="ml-2"
            @click="toggleShowAPIKeys"
            >{{ showAPIKeys ? 'Hide API Keys' : 'Show API Keys' }}
          </v-btn>
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
            :disabled="!admin && update_unavailable"
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
import ActionDialog from '@/components/generic/ActionDialog.vue';
import CopyButton from '@/components/generic/CopyButton.vue';
import InputDialog from '@/components/generic/InputDialog.vue';
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';
import {IApiKey, IUpdateUser, IUser} from '@heimdall/common/interfaces';
import axios from 'axios';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {email, required, requiredIf} from 'vuelidate/lib/validators';

@Component({
  components: {ActionDialog, CopyButton, InputDialog},
  mixins: [UserValidatorMixin],
  validations: {
    userInfo: {
      email: {
        required,
        email
      }
    },
    currentPassword: {
      required: requiredIf(function (userInfo) {
        return userInfo.user.role === 'admin';
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

  showAPIKeys = false;
  apiKeyHeaders = [
    {
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
  ];

  apiKeys: IApiKey[] = [];
  get apiKeysEnabled(): boolean {
    return ServerModule.apiKeysEnabled;
  }

  apiKeyTableLoading = false;
  activeAPIKey: IApiKey | null = null;
  inputPasswordDialog = false;

  dialog = false;
  changePassword = false;

  userInfo: IUser = {...this.user};
  currentPassword = '';
  newPassword = '';
  passwordConfirmation = '';
  buttonLoading = false;
  updateCallback = () => {
    return;
  };

  mounted() {
    this.getAPIKeys();
  }

  async updateUserInfo(): Promise<void> {
    this.buttonLoading = true;
    this.$v.$touch();
    if (this.userInfo != null && (this.admin || !this.$v.$invalid)) {
      var updateUserInfo: IUpdateUser = {
        ...this.userInfo,
        password: undefined,
        passwordConfirmation: undefined,
        forcePasswordChange: undefined
      };
      if (!this.admin) {
        updateUserInfo = {
          ...updateUserInfo,
          currentPassword: this.currentPassword
        };
      }
      if (this.changePassword) {
        updateUserInfo = {
          ...updateUserInfo,
          password: this.newPassword,
          passwordConfirmation: this.passwordConfirmation
        };
      }
      ServerModule.updateUserInfo({id: this.user.id, info: updateUserInfo})
        .then((data) => {
          SnackbarModule.notify('User updated successfully.');
          this.$emit('update-user', data);
          this.dialog = false;
        })
        .finally(() => {
          this.buttonLoading = false;
        });
    }
  }

  changePasswordDialog() {
    this.changePassword = !this.changePassword;
  }

  toggleShowAPIKeys() {
    this.showAPIKeys = !this.showAPIKeys;
  }

  getAPIKeys() {
    if (this.apiKeysEnabled) {
      this.apiKeyTableLoading = true;
      axios
        .create()
        .get<IApiKey[]>(`/apikeys`, {params: {userId: this.user.id}})
        .then(({data}) => {
          this.apiKeys = data;
        })
        .catch((error) => {
          if (error.response) {
            SnackbarModule.failure('Unable to get API Keys');
          }
        });
      this.apiKeyTableLoading = false;
    }
  }

  addAPIKey() {
    this.inputPasswordDialog = false;
    this.apiKeyTableLoading = true;
    axios
      .post<IApiKey>(`/apikeys`, {
        userId: this.user.id,
        name: this.activeAPIKey?.name,
        currentPassword: this.currentPassword
      })
      .then(({data}) => this.apiKeys.push(data))
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 403) {
            this.updateCallback = this.addAPIKey;
            this.inputPasswordDialog = true;
          }
        }
        throw error;
      })
      .finally(() => {
        this.activeAPIKey = null;
        this.apiKeyTableLoading = false;
      });
  }

  deleteAPIKey(item: IApiKey) {
    if (typeof item === 'object') {
      this.activeAPIKey = item;
    }
    this.inputPasswordDialog = false;
    axios
      .delete<IApiKey>(`/apikeys/${this.activeAPIKey?.id}`, {
        data: {...this.activeAPIKey, currentPassword: this.currentPassword}
      })
      .then(() => {
        this.apiKeys = this.apiKeys.filter((key) => key.id !== item.id);
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 403) {
            this.updateCallback = this.deleteAPIKeyConfirm;
            this.inputPasswordDialog = true;
          }
        }
        throw error;
      });
    this.activeAPIKey = null;
  }

  deleteAPIKeyConfirm() {
    this.inputPasswordDialog = false;
    axios
      .delete<IApiKey>(`/apikeys/${this.activeAPIKey?.id}`, {
        data: {...this.activeAPIKey, currentPassword: this.currentPassword}
      })
      .then(({data}) => {
        this.apiKeys = this.apiKeys.filter((key) => key.id !== data.id);
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 403) {
            this.inputPasswordDialog = true;
          }
        }
        throw error;
      });
  }

  updateAPIKey(item?: IApiKey) {
    if (typeof item === 'object') {
      this.activeAPIKey = item;
    }
    this.inputPasswordDialog = false;
    axios
      .put<IApiKey>(`/apikeys/${this.activeAPIKey?.id}`, {
        name: this.activeAPIKey?.name,
        currentPassword: this.currentPassword
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 403) {
            this.updateCallback = this.updateAPIKey;
            this.inputPasswordDialog = true;
          }
        }
        throw error;
      });
    this.activeAPIKey = null;
  }

  refreshAPIKey(item: IApiKey) {
    if (typeof item === 'object') {
      this.activeAPIKey = item;
    }
    this.inputPasswordDialog = false;
    axios
      .delete<IApiKey>(`/apikeys/${this.activeAPIKey?.id}`, {
        data: {...this.activeAPIKey, currentPassword: this.currentPassword}
      })
      .then(() => {
        this.apiKeys = this.apiKeys.filter((key) => key.id !== item.id);
        this.addAPIKey();
      })
      .catch((error) => {
        if (error.response) {
          if (error.response.status === 403) {
            this.updateCallback = this.refreshAPIKeyConfirm;
            this.inputPasswordDialog = true;
          }
        }
        throw error;
      });
    this.activeAPIKey = null;
  }

  refreshAPIKeyConfirm() {
    this.deleteAPIKeyConfirm();
    this.addAPIKey();
  }

  updateCurrentPassword(password: string): void {
    this.currentPassword = password;
  }

  get update_unavailable() {
    return (
      this.userInfo.creationMethod === 'ldap' ||
      ServerModule.enabledOAuth.includes(this.userInfo.creationMethod)
    );
  }

  get title(): string {
    if (this.admin) {
      return `Update account information for ${this.user.email}`;
    } else {
      return 'Update your account information';
    }
  }
}
</script>

<style scoped>
.break-lines {
  overflow-wrap: anywhere;
}
</style>
