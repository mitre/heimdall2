<template>
  <v-dialog v-model="dialog" max-width="700px">
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template #activator="{on, attrs}">
      <slot name="clickable" :on="on" :attrs="attrs" />
    </template>
    <v-card class="rounded-t-0">
      <v-card-title
        data-cy="groupModalTitle"
        class="headline mitreSecondaryBlue"
        primary-title
        >Group API Keys</v-card-title
      >
      <v-card-text>
        <div
          class="d-flex flex-row-reverse"
          style="cursor: pointer"
          @click="addAPIKey"
        >
          <span class="pt-1">Add API Key</span>
          <v-icon>mdi-plus</v-icon>
        </div>
        <v-data-table
          :headers="apiKeyHeaders"
          :items="apiKeys"
          :items-per-page="5"
          :search="search"
          class="elevation-0"
          :loading="loading"
          :loading-text="loadingText"
          :no-data-text="noDataText"
          :no-results-text="noResultsText"
          :footer-props="{
            'items-per-page-options': [5, 10, 25, 50, 100]
          }"
        >
          <template #[`item.name`]="{item}"
            ><v-text-field v-model="item.name" @change="setKeyName(item)"
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
            <v-tooltip top>
              <template #activator="{on, attrs}">
                <span v-bind="attrs" v-on="on">
                  <CopyButton v-if="item.apiKey" :text="item.apiKey" />
                </span>
              </template>
              <span>Copy this API Key</span>
            </v-tooltip>
          </template>
        </v-data-table>
        <v-text-field
          id="password_field"
          ref="password"
          v-model="password"
          type="password"
          label="Password"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-col class="text-right">
          <v-btn
            data-cy="closeAndDiscardChanges"
            color="primary"
            text
            @click="dialog = false"
            >Close</v-btn
          >
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import ActionDialog from '@/components/generic/ActionDialog.vue';
import Users from '@/components/global/groups/Users.vue';
import CopyButton from '@/components/generic/CopyButton.vue';
import {SnackbarModule} from '@/store/snackbar';
import {IApiKey, IGroup} from '@heimdall/common/interfaces';
import axios from 'axios';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

@Component({
  components: {
    ActionDialog,
    CopyButton,
    Users
  }
})
export default class GroupAPIKeysModal extends Vue {
  @Prop({
    type: Object,
    required: true
  })
  readonly group!: IGroup;

  dialog = false;
  loading = false;
  apiKeys: IApiKey[] = [];
  search = '';
  password = '';
  loadingText = 'Loading...';
  noDataText = 'No API Keys';
  noResultsText = 'No API Keys found';
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

  mounted() {
    this.updateAPIKeys();
  }

  updateAPIKeys() {
    this.loading = true;
    axios
      .get<IApiKey[]>(`/apikeys`, {
        params: {
          groupId: this.group.id
        }
      })
      .then(({data}) => {
        this.apiKeys = data;
        this.loading = false;
      })
      .catch((error) => {
        this.loading = false;
        // Default error handling works fine
        throw error;
      });
  }

  refreshAPIKey(item: IApiKey) {
    this.loading = true;
    axios
      .delete<IApiKey>(`/apikeys/${item.id}`, {
        data: {
          currentPassword: this.password
        }
      })
      .then(() => {
        this.apiKeys = this.apiKeys.filter((key) => key.id !== item.id);

        // Re-create the key
        axios
          .post('/apikeys', {
            groupId: this.group.id,
            name: item.name,
            currentPassword: this.password
          })
          .then(({data}) => {
            this.apiKeys.push(data);
            SnackbarModule.notify('API Key recreated successfully');
            this.loading = false;
          })
          .catch((error) => {
            this.loading = false;
            // Default error handling works fine
            throw error;
          });
      })
      .catch((error) => {
        this.loading = false;
        // Default error handling works fine
        throw error;
      });
  }

  addAPIKey() {
    this.loading = true;
    axios
      .post<IApiKey>('/apikeys', {
        groupId: this.group.id,
        currentPassword: this.password
      })
      .then(({data}) => {
        this.apiKeys.push(data);
        SnackbarModule.notify('API Key added successfully');
        this.loading = false;
      })
      .catch((error) => {
        this.loading = false;
        // Default error handling works fine
        throw error;
      });
  }

  setKeyName(item: IApiKey) {
    this.loading = true;
    axios
      .put(`/apikeys/${item.id}`, {
        name: item.name,
        currentPassword: this.password
      })
      .then(() => {
        SnackbarModule.notify('API Key name updated successfully');
        this.loading = false;
      })
      .catch((error) => {
        this.loading = false;
        // Default error handling works fine
        throw error;
      });
  }

  deleteAPIKey(item: IApiKey) {
    this.loading = true;
    axios
      .delete<IApiKey>(`/apikeys/${item.id}`, {
        data: {
          currentPassword: this.password
        }
      })
      .then(({data}) => {
        this.apiKeys = this.apiKeys.filter((key) => key.id !== data.id);
        SnackbarModule.notify('API Key deleted successfully');
        this.loading = false;
      })
      .catch((error) => {
        this.loading = false;
        // Default error handling works fine
        throw error;
      });
  }
}
</script>

<style scoped>
.break-lines {
  overflow-wrap: anywhere;
}
</style>
