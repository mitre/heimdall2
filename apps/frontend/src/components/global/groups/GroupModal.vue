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
        <v-form data-cy="updateGroupForm">
          <v-row>
            <v-col>
              <v-text-field
                id="name"
                v-model="groupInfo.name"
                label="Group Name"
              />
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <span v-on="on">
                  <v-checkbox
                    id="public"
                    v-model="groupInfo.public"
                    label="Make Publicly Visible?"
                  />
                  </span>
                </template>
                <span>This will make the group name visible to all logged in users. It will not expose any results or profiles added to the group.</span>
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
          <v-btn
            id="closeAndSaveChanges"
            color="primary"
            text
            @click="updateGroupInfo"
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
import {ServerModule} from '@/store/server';
import {SnackbarModule} from '@/store/snackbar';
import {ICreateGroup, IGroup} from '@heimdall/interfaces';
import UserValidatorMixin from '@/mixins/UserValidatorMixin';
import {Prop} from 'vue-property-decorator';
import axios from 'axios';

@Component({
  mixins: [UserValidatorMixin],
  validations: {}
})

export default class GroupModal extends Vue {
  @Prop({
    type: Object,
    required: false,
    default: function() {
      return {
        id: '-1',
        name: '',
        public: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
    }) readonly group!: IGroup;
  @Prop({type: Boolean, default: false}) readonly admin!: boolean;
  @Prop({type: Boolean, default: false}) readonly create!: boolean;

  roles: string[] = ['user', 'admin'];

  dialog: boolean = false;
  changePassword: boolean = false;

  groupInfo: IGroup = { ...this.group };
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

  async updateGroupInfo(): Promise<void> {
    let groupInfo: ICreateGroup = {
      ...this.groupInfo,
    };

    axios.post<IGroup>('/groups', groupInfo).then((group) =>
    {
      debugger;
    });
  }
}
</script>
