<template>
  <v-dialog
    v-model="dialog"
    max-width="700px"
  >
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template #activator="{on, attrs}">
      <slot
        name="clickable"
        :on="on"
        :attrs="attrs"
      />
    </template>
    <v-card
      class="rounded-t-0"
      :data-cy="create ? 'createGroupForm' : 'updateGroupForm'"
    >
      <v-card-title
        data-cy="groupModalTitle"
        class="headline mitreSecondaryBlue"
        primary-title
      >
        {{ title }}
      </v-card-title>
      <v-card-text>
        <br>
        <v-form @submit.prevent>
          <v-row>
            <v-col cols="8">
              <v-text-field
                v-model="groupInfo.name"
                data-cy="name"
                label="Group Name"
                @input="checkUniqueName"
              />
            </v-col>
            <v-col>
              <v-tooltip bottom>
                <template #activator="{on}">
                  <span v-on="on">
                    <v-checkbox
                      v-model="groupInfo.public"
                      data-cy="public"
                      label="Make Publicly Visible?"
                    />
                  </span>
                </template>
                <span>
                  This will make the group name visible to all logged in users.
                  It will not expose any results or profiles added to the group.
                </span>
              </v-tooltip>
            </v-col>
          </v-row>
          <v-textarea
            v-model="groupInfo.desc"
            data-cy="desc"
            label="Description"
            rows="1"
            auto-grow
          />
          <Users
            v-model="groupInfo.users"
            :editable="true"
            :create="create"
            :admin="admin"
            @on-update-group-user-role="updateSaveState"
            @delete-user-confirm="updateSaveState"
          />
        </v-form>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <GroupAPIKeysModal
          v-if="!create && apiKeysEnabled"
          :group="group"
        >
          <template #clickable="{on, attrs}">
            <v-btn
              data-cy="groupAPIKeys"
              color="primary"
              text
              v-bind="attrs"
              v-on="on"
            >
              Manage API Keys
            </v-btn>
          </template>
        </GroupAPIKeysModal>
        <v-spacer />
        <v-btn
          data-cy="closeAndDiscardChanges"
          color="primary"
          text
          @click="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          data-cy="closeAndSaveChanges"
          color="primary"
          text
          :disabled="!saveable || duplicateName"
          @click="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import type {
  IAddUserToGroup,
  ICreateGroup,
  IGroup,
  IRemoveUserFromGroup,
  ISlimUser,
  IUpdateGroupUser,
} from '@heimdall/common/interfaces';
import axios, { AxiosResponse } from 'axios';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ActionDialog from '@/components/generic/ActionDialog.vue';
import GroupAPIKeysModal from '@/components/global/groups/GroupAPIKeysModal.vue';
import Users from '@/components/global/groups/Users.vue';
import { GroupsModule } from '@/store/groups';
import { ServerModule } from '@/store/server';
import { SnackbarModule } from '@/store/snackbar';

function newGroup(): IGroup {
  return {
    createdAt: new Date(),
    desc: '',
    id: '-1',
    name: '',
    public: false,
    role: '',
    updatedAt: new Date(),
    users: [],
  };
}

@Component({
  components: {
    ActionDialog,
    GroupAPIKeysModal,
    Users,
  },
})
export default class GroupModal extends Vue {
  @Prop({ default: false, type: Boolean }) readonly admin!: boolean;

  changePassword = false;
  @Prop({ default: false, type: Boolean }) readonly create!: boolean;
  currentPassword = '';
  dialog = false;
  // Upon group name change, the component will detect whether the current state is acceptable
  duplicateName = false;

  @Prop({
    default: () => {
      return newGroup();
    },
    required: false,
    type: Object,
  })
  readonly group!: IGroup;

  groupInfo: IGroup = _.cloneDeep(this.group);
  newPassword = '';
  passwordConfirmation = '';

  // Upon user role update, the child component will emit whether the current state is acceptable
  saveable = true;

  get apiKeysEnabled(): boolean {
    return ServerModule.apiKeysEnabled;
  }

  get title(): string {
    return this.create ? 'Create a New Group' : 'Update Group';
  }

  async cancel(): Promise<void> {
    this.dialog = false;
    this.groupInfo = _.cloneDeep(this.group); // Reset the working state of the edit operation
  }

  checkUniqueName(name: string) {
    this.duplicateName = GroupsModule.allGroups.some(
      group => group.name === name && group.id !== this.groupInfo.id,
    );
    if (this.duplicateName) {
      SnackbarModule.failure('Group names must be unique.');
    }
  }

  async createGroup(createGroup: ICreateGroup): Promise<AxiosResponse<IGroup>> {
    return axios.post<IGroup>('/groups', createGroup);
  }

  async save(): Promise<void> {
    const groupInfo: ICreateGroup = { ...this.groupInfo };

    try {
      const response = await (this.create
        ? this.createGroup(groupInfo)
        : this.updateExistingGroup(groupInfo));
      const group = response.data;
      await GroupsModule.UpdateGroupById(group.id);
      await this.syncUsersWithGroup(group);
      // This clears when creating a new Group.
      // Calling clear on edit makes it impossible to edit the same group twice.
      if (this.create) {
        this.groupInfo = newGroup();
      }
      this.dialog = false;
      // This updates the store after the change propagates through the database
      // Not calling this would result in reactivity delays on the frontend
      await GroupsModule.FetchGroupData();
      SnackbarModule.notify('Group Successfully Saved');
    } catch (error) {
      SnackbarModule.failure(`Failed to Save Group: ${error}`);
    }
  }

  async syncUsersWithGroup(group: IGroup) {
    const originalIds = new Set(this.group.users.map(user => user.id));
    const changedIds = new Set(this.groupInfo.users.map(user => user.id));
    const toAdd: ISlimUser[] = this.groupInfo.users.filter(
      user => !originalIds.has(user.id),
    );
    const toRemove: ISlimUser[] = this.group.users.filter(
      user => !changedIds.has(user.id),
    );
    const toUpdate: ISlimUser[] = this.groupInfo.users.filter(newUser =>
      this.group.users.some(
        user => user.id === newUser.id && user.groupRole !== newUser.groupRole,
      ),
    );
    const addedUserPromises = toAdd.map((user) => {
      const addUserDto: IAddUserToGroup = {
        groupRole: user.groupRole || 'member',
        userId: user.id,
      };
      return axios.post(`/groups/${group.id}/user`, addUserDto);
    });
    const updatedUserPromises = toUpdate.map((user) => {
      const updateGroupUserRole: IUpdateGroupUser = {
        groupRole: user.groupRole || 'member',
        userId: user.id,
      };
      return axios.put(
        `/groups/${group.id}/updateGroupUserRole`,
        updateGroupUserRole,
      );
    });
    const removedUserPromises = toRemove.map((user) => {
      const removeUserDto: IRemoveUserFromGroup = { userId: user.id };
      return axios.delete(`/groups/${group.id}/user`, { data: removeUserDto });
    });
    return Promise.all([...addedUserPromises, ...updatedUserPromises]).then(
      () => {
        return Promise.all(removedUserPromises);
      },
    );
  }

  async updateExistingGroup(
    groupToUpdate: ICreateGroup,
  ): Promise<AxiosResponse<IGroup>> {
    return axios.put<IGroup>(`/groups/${this.groupInfo.id}`, groupToUpdate);
  }

  updateSaveState(saveable: boolean) {
    if (!this.create) {
      if (!saveable) { SnackbarModule.failure('Must have at least 1 owner'); }
      this.saveable = saveable;
    }
  }
}
</script>
