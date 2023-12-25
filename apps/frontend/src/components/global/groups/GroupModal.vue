<template>
  <v-dialog v-model="dialog" max-width="700px">
    <!-- clickable slot passes the activator prop up to parent
        This allows the parent to pass in a clickable icon -->
    <template #activator="{on, attrs}">
      <slot name="clickable" :on="on" :attrs="attrs" />
    </template>
    <v-card
      class="rounded-t-0"
      :data-cy="create ? 'createGroupForm' : 'updateGroupForm'"
    >
      <v-card-title
        data-cy="groupModalTitle"
        class="headline mitreSecondaryBlue"
        primary-title
        >{{ title }}</v-card-title
      >
      <v-card-text>
        <br />
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
        <GroupAPIKeysModal v-if="!create && apiKeysEnabled" :group="group">
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
import ActionDialog from '@/components/generic/ActionDialog.vue';
import GroupAPIKeysModal from '@/components/global/groups/GroupAPIKeysModal.vue';
import Users from '@/components/global/groups/Users.vue';
import {GroupsModule} from '@/store/groups';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';
import {
  IAddUserToGroup,
  ICreateGroup,
  IGroup,
  IRemoveUserFromGroup,
  ISlimUser,
  IUpdateGroupUser
} from '@heimdall/common/interfaces';
import axios, {AxiosResponse} from 'axios';
import * as _ from 'lodash';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';

function newGroup(): IGroup {
  return {
    id: '-1',
    name: '',
    role: '',
    public: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    desc: '',
    users: []
  };
}

@Component({
  components: {
    ActionDialog,
    GroupAPIKeysModal,
    Users
  }
})
export default class GroupModal extends Vue {
  @Prop({
    type: Object,
    required: false,
    default: () => {
      return newGroup();
    }
  })
  readonly group!: IGroup;

  @Prop({type: Boolean, default: false}) readonly admin!: boolean;
  @Prop({type: Boolean, default: false}) readonly create!: boolean;
  dialog = false;
  changePassword = false;
  groupInfo: IGroup = _.cloneDeep(this.group);

  currentPassword = '';
  newPassword = '';
  passwordConfirmation = '';
  get title(): string {
    if (this.create) {
      return 'Create a New Group';
    } else {
      return 'Update Group';
    }
  }

  get apiKeysEnabled(): boolean {
    return ServerModule.apiKeysEnabled;
  }

  // Upon user role update, the child component will emit whether the current state is acceptable
  saveable = true;
  updateSaveState(saveable: boolean) {
    if (!this.create) {
      if (!saveable) SnackbarModule.failure(`Must have at least 1 owner`);
      this.saveable = saveable;
    }
  }

  // Upon group name change, the component will detect whether the current state is acceptable
  duplicateName = false;
  checkUniqueName(name: string) {
    this.duplicateName = GroupsModule.allGroups.some(
      (group) => group.name === name && group.id !== this.groupInfo.id
    );
    if (this.duplicateName) {
      SnackbarModule.failure(`Group names must be unique.`);
    }
  }

  async save(): Promise<void> {
    const groupInfo: ICreateGroup = {
      ...this.groupInfo
    };

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
      SnackbarModule.notify(`Group Successfully Saved`);
    } catch (err) {
      SnackbarModule.failure(`Failed to Save Group: ${err}`);
    }
  }

  async cancel(): Promise<void> {
    this.dialog = false;
    this.groupInfo = _.cloneDeep(this.group); // Reset the working state of the edit operation
  }

  async createGroup(createGroup: ICreateGroup): Promise<AxiosResponse<IGroup>> {
    return axios.post<IGroup>('/groups', createGroup);
  }

  async updateExistingGroup(
    groupToUpdate: ICreateGroup
  ): Promise<AxiosResponse<IGroup>> {
    return axios.put<IGroup>(`/groups/${this.groupInfo.id}`, groupToUpdate);
  }

  async syncUsersWithGroup(group: IGroup) {
    const originalIds = this.group.users.map((user) => user.id);
    const changedIds = this.groupInfo.users.map((user) => user.id);
    const toAdd: ISlimUser[] = this.groupInfo.users.filter(
      (user) => !originalIds.includes(user.id)
    );
    const toRemove: ISlimUser[] = this.group.users.filter(
      (user) => !changedIds.includes(user.id)
    );
    const toUpdate: ISlimUser[] = this.groupInfo.users.filter((newUser) =>
      this.group.users.some(
        (user) => user.id === newUser.id && user.groupRole !== newUser.groupRole
      )
    );
    const addedUserPromises = toAdd.map((user) => {
      const addUserDto: IAddUserToGroup = {
        userId: user.id,
        groupRole: user.groupRole || 'member'
      };
      return axios.post(`/groups/${group.id}/user`, addUserDto);
    });
    const updatedUserPromises = toUpdate.map((user) => {
      const updateGroupUserRole: IUpdateGroupUser = {
        userId: user.id,
        groupRole: user.groupRole || 'member'
      };
      return axios.put(
        `/groups/${group.id}/updateGroupUserRole`,
        updateGroupUserRole
      );
    });
    const removedUserPromises = toRemove.map((user) => {
      const removeUserDto: IRemoveUserFromGroup = {
        userId: user.id
      };
      return axios.delete(`/groups/${group.id}/user`, {data: removeUserDto});
    });
    return Promise.all([...addedUserPromises, ...updatedUserPromises]).then(
      () => {
        return Promise.all(removedUserPromises);
      }
    );
  }
}
</script>
