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
                  Also note that private groups CANNOT have any associated
                  parent or child groups.
                </span>
              </v-tooltip>
            </v-col>
          </v-row>
          <v-autocomplete
            v-model="parentGroupId"
            :items="availableGroups"
            label="Parent Group (optional)"
            chips
            deletable-chips
            :disabled="!groupInfo.public"
          />
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
import {GroupRelationsModule} from '@/store/group_relations';
import {GroupsModule} from '@/store/groups';
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';
import {getAllDescendants} from '@/utilities/group_relations_util';
import {IVuetifyItems} from '@/utilities/helper_util';
import {
  IAddGroupRelation,
  IAddUserToGroup,
  ICreateGroup,
  IGroup,
  IGroupRelation,
  IRemoveUserFromGroup,
  ISlimUser,
  IUpdateGroupUser
} from '@heimdall/interfaces';
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
    public: true,
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

  parentGroupIdInternal: string | null = this.parentGroupId;

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

  get parentGroupId(): string | null {
    return (
      GroupRelationsModule.allGroupRelations.find(
        (groupRelation) => groupRelation.childId === this.groupInfo.id
      )?.parentId || null
    );
  }

  set parentGroupId(updatedParentGroupId: string | null) {
    this.parentGroupIdInternal = updatedParentGroupId;
  }

  get availableGroups(): IVuetifyItems[] {
    const descendants = getAllDescendants(this.group.id);
    const groups = GroupsModule.myGroups.filter(
      (group) =>
        group.id !== this.groupInfo.id &&
        !descendants.some((descendant) => descendant === group.id) &&
        (this.admin || group.role === 'owner') &&
        group.public
    );
    return groups.map((group) => {
      return {
        text: group.name,
        value: group.id
      };
    });
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

      if (!group.public) {
        const adjacentRelations = GroupRelationsModule.allGroupRelations.filter(
          (relation) =>
            relation.childId === group.id || relation.parentId === group.id
        );
        await Promise.all(
          adjacentRelations.map((relation) =>
            GroupRelationsModule.DeleteGroupRelation(relation)
          )
        );
      } else {
        let groupRelation = GroupRelationsModule.allGroupRelations.find(
          (groupRelation) => groupRelation.childId === group.id
        );
        // If there is an existing relation, either update or delete it. If not, add a new one.
        if (groupRelation) {
          if (this.parentGroupIdInternal) {
            await this.updateExistingGroupRelation({
              parentId: this.parentGroupIdInternal,
              childId: group.id
            });
          } else {
            await GroupRelationsModule.DeleteGroupRelation(groupRelation);
          }
        } else {
          if (this.parentGroupIdInternal) {
            groupRelation = (
              await this.addGroupRelation({
                parentId: this.parentGroupIdInternal,
                childId: group.id
              })
            ).data;
          }
        }
        if (groupRelation) {
          await GroupRelationsModule.UpdateGroupRelationById(groupRelation.id);
        }
      }

      // This clears when creating a new Group.
      // Calling clear on edit makes it impossible to edit the same group twice.
      if (this.create) {
        this.groupInfo = newGroup();
      }
      this.dialog = false;

      // This updates the store after the change propagates through the database
      // Not calling this would result in reactivity delays on the frontend
      await GroupsModule.FetchGroupData();
      await GroupRelationsModule.FetchGroupRelationData();
      this.$emit('group-saved', [group.id]);
      SnackbarModule.notify(`Group Successfully Saved`);
    } catch (err) {
      SnackbarModule.failure(`Failed to Save Group: ${err}`);
    }
  }

  async cancel(): Promise<void> {
    this.dialog = false;
    this.group
      ? (this.groupInfo = _.cloneDeep(this.group))
      : (this.groupInfo = newGroup()); // Reset the working state of the edit operation
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

  async addGroupRelation(
    addGroupRelation: IAddGroupRelation
  ): Promise<AxiosResponse<IGroupRelation>> {
    return axios.post<IGroupRelation>('/group-relations', addGroupRelation);
  }

  async updateExistingGroupRelation(
    groupRelationToUpdate: IAddGroupRelation
  ): Promise<AxiosResponse<IGroupRelation>> {
    return axios.put<IGroupRelation>(
      `/group-relations/${
        GroupRelationsModule.allGroupRelations.find(
          (groupRelation) => groupRelation.childId === this.groupInfo.id
        )?.id
      }`,
      groupRelationToUpdate
    );
  }
}
</script>
