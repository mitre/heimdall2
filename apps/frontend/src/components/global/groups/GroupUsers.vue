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
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {ISlimUser} from '@heimdall/interfaces';
import {Prop, VModel} from 'vue-property-decorator';
import Users from '@/components/global/groups/Users.vue';

@Component({
  validations: {},
  components: {
    Users
  }
})
export default class GroupUsers extends Vue {
  @VModel({type: Array, required: true}) selectedGroupUsers!: ISlimUser[];
  @Prop({type: Boolean, default: false}) readonly dialogDisplayUsers!: boolean;

}
</script>
