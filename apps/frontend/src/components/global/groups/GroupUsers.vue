<template>
  <v-dialog
    v-model="dialogDisplayUsers"
    max-width="700px"
    @click:outside="$emit('close-group-users-dialog')"
  >
    <v-card class="rounded-t-0">
      <v-card-title
        data-cy="groupModalTitle"
        class="headline mitreSecondaryBlue"
        primary-title
      >
        {{ role }}
      </v-card-title>
      <v-card-text>
        <Users v-model="selectedGroupUsers" :editable="false" />
      </v-card-text>
      <v-card-actions>
        <v-col class="text-right">
          <v-btn
            color="primary"
            text
            @click="$emit('close-group-users-dialog')"
          >
            Close
          </v-btn>
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Users from '@/components/global/groups/Users.vue';
import {ISlimUser} from '@heimdall/common/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, VModel} from 'vue-property-decorator';

@Component({
  components: {
    Users
  }
})
export default class GroupUsers extends Vue {
  @VModel({type: Array, required: true}) selectedGroupUsers!: ISlimUser[];
  @Prop({type: Boolean, default: false}) readonly dialogDisplayUsers!: boolean;

  get role() {
    if (
      this.selectedGroupUsers.length > 0 &&
      this.selectedGroupUsers[0].groupRole
    ) {
      return (
        this.selectedGroupUsers[0].groupRole.charAt(0).toUpperCase() +
        this.selectedGroupUsers[0].groupRole.slice(1) +
        's'
      );
    } else {
      return 'Members';
    }
  }
}
</script>
