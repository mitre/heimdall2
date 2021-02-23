<template>
  <v-dialog v-model="dialog" max-width="500px">
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
        >{{ title }}</v-card-title
      >
      <v-card-text>
        <br />
        <v-form data-cy="updateGroupForm" @submit.prevent>
          <v-row>
            <v-col>
              <v-text-field
                id="name"
                v-model="groupInfo.name"
                label="Group Name"
                @keyup.enter="save"
              />
              <v-tooltip bottom>
                <template #activator="{on}">
                  <span v-on="on">
                    <v-checkbox
                      id="public"
                      v-model="groupInfo.public"
                      label="Make Publicly Visible?"
                    />
                  </span>
                </template>
                <span
                  >This will make the group name visible to all logged in users.
                  It will not expose any results or profiles added to the
                  group.</span
                >
              </v-tooltip>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-col class="text-right">
          <v-btn
            id="closeAndDiscardChanges"
            color="primary"
            text
            @click="dialog = false"
            >Cancel</v-btn
          >
          <v-btn id="closeAndSaveChanges" color="primary" text @click="save"
            >Save</v-btn
          >
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {SnackbarModule} from '@/store/snackbar';
import {ICreateGroup, IGroup} from '@heimdall/interfaces';
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {Prop} from 'vue-property-decorator';
import axios, {AxiosResponse} from 'axios';
import {GroupsModule} from '@/store/groups';

function newGroup(): IGroup {
  return {
    id: '-1',
    name: '',
    public: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

@Component({
  mixins: [UserValidatorMixin],
  validations: {}
})
export default class GroupModal extends Vue {
  @Prop({
    type: Object,
    required: false,
    default: function() {
      newGroup()
    }
    }) readonly group!: IGroup;
  @Prop({type: Boolean, default: false}) readonly admin!: boolean;
  @Prop({type: Boolean, default: false}) readonly create!: boolean;

  roles: string[] = ['user', 'admin'];

  dialog: boolean = false;
  changePassword: boolean = false;

  groupInfo: IGroup = {...this.group};
  currentPassword: string = '';
  newPassword: string = '';
  passwordConfirmation: string = '';

  get title(): string {
    if(this.create) {
      return 'Create a New Group'
    }
    else {
      return 'Update Group'
    }
  }

  async save(): Promise<void> {
    let groupInfo: ICreateGroup = {
      ...this.groupInfo,
    };

    const response = this.create ? this.createGroup(groupInfo) : this.updateExistingGroup(groupInfo);
    response.then(({data}) => {
      GroupsModule.UpdateGroup(data).then(() => {
        SnackbarModule.notify(`Group Successfully Saved`);
        // This clears when creating a new Group.
        // Calling clear on edit makes it impossible to edit the same group twice.
        if(this.create) {
          this.groupInfo = newGroup();
        }
        this.dialog = false;
      });
    }).catch((err) => {
      // If the backend provided an error then show it, otherwise fallback to printing the client side error
      SnackbarModule.failure(err?.response?.data?.message || `${err}. Please reload the page and try again.`);
    })
  }

  async createGroup(createGroup: ICreateGroup): Promise<AxiosResponse<IGroup>> {
    return axios.post<IGroup>('/groups', createGroup)
  }

  async updateExistingGroup(groupToUpdate: ICreateGroup): Promise<AxiosResponse<IGroup>> {
    return axios.put<IGroup>(`/groups/${this.groupInfo.id}`, groupToUpdate);
  }
}
</script>
