<template>
  <v-dialog v-model="dialogDisplayUsers" max-width="700px">
      <v-card class="rounded-t-0">
        <v-card-title
          data-cy="groupModalTitle"
          class="headline mitreSecondaryBlue"
          primary-title
          >{{ 'Members' }}</v-card-title
        >
        <v-card-text>
          <Users v-model="selectedGroupUsers" :editable="false" />
        </v-card-text>
        <v-card-actions>
          <v-col class="text-right">
            <v-btn color="primary" text @click="dialogDisplayUsers = false"
              >Close</v-btn
            >
          </v-col>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {SnackbarModule} from '@/store/snackbar';
import {IAddUserToGroup, ICreateGroup, IGroup, IRemoveUserFromGroup, ISlimUser} from '@heimdall/interfaces';
import {Prop} from 'vue-property-decorator';
import axios, {AxiosResponse} from 'axios';
import {GroupsModule} from '@/store/groups';
import Users from '@/components/global/groups/Users.vue';
import DeleteDialog from '@/components/global/DeleteDialog.vue';
import _ from 'lodash';

function newGroup(): IGroup {
  return {
    id: '-1',
    name: '',
    public: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: []
  }
}

@Component({
  validations: {},
  components: {
    DeleteDialog,
    Users
  }
})
export default class GroupModal extends Vue {
  @Prop({
    type: Object,
    required: false,
    default: () => {
      return newGroup()
    }
    }) readonly group!: IGroup;
  @Prop({type: Boolean, default: false}) readonly admin!: boolean;
  @Prop({type: Boolean, default: false}) readonly create!: boolean;

  dialog = false;
  changePassword = false;

  groupInfo: IGroup = _.cloneDeep(this.group);
  currentPassword = '';
  newPassword = '';
  passwordConfirmation = '';

  get title(): string {
    if(this.create) {
      return 'Create a New Group'
    }
    else {
      return 'Update Group'
    }
  }

  async save(): Promise<void> {
    const groupInfo: ICreateGroup = {
      ...this.groupInfo,
    };

    const response = this.create ? this.createGroup(groupInfo) : this.updateExistingGroup(groupInfo);
    response.then(({data}) => {
      this.syncUsersWithGroup(data).then(() => {
        GroupsModule.GetGroupById(data.id);
        SnackbarModule.notify(`Group Successfully Saved`);
        // This clears when creating a new Group.
        // Calling clear on edit makes it impossible to edit the same group twice.
        if(this.create) {
          this.groupInfo = newGroup();
        }
        this.dialog = false;
      });
    })
  }

  async createGroup(createGroup: ICreateGroup): Promise<AxiosResponse<IGroup>> {
    return axios.post<IGroup>('/groups', createGroup)
  }

  async updateExistingGroup(groupToUpdate: ICreateGroup): Promise<AxiosResponse<IGroup>> {
    return axios.put<IGroup>(`/groups/${this.groupInfo.id}`, groupToUpdate);
  }

  async syncUsersWithGroup(group: IGroup) {
    const originalIds = this.group.users.map((user) => user.id);
    const changedIds = this.groupInfo.users.map((user) => user.id);
    const toAdd: ISlimUser[] = this.groupInfo.users.filter(user => !originalIds.includes(user.id));
    const toRemove: ISlimUser[] = this.group.users.filter(user => !changedIds.includes(user.id));
    const addedUserPromises = toAdd.map((user) => {
      const addUserDto: IAddUserToGroup = {
        userId: user.id,
        groupRole: 'member'
      }
      return axios.post(`/groups/${group.id}/user`, addUserDto);
    });

    const removedUserPromises = toRemove.map((user) => {
      const removeUserDto: IRemoveUserFromGroup = {
        userId: user.id
      }
      return axios.delete(`/groups/${group.id}/user`, {data: removeUserDto});
    });

    return Promise.all(addedUserPromises.concat(removedUserPromises))
  }
}
</script>
