<template>
  <v-dialog
    v-model="display"
    max-width="700px"
    @click:outside="$emit('close-users-display')"
  >
    <v-card class="rounded-t-0">
      <v-col>
        <v-data-table :headers="headers" :items="members" :items-per-page="5">
          <template #[`item.full-name`]="{item}"
            >{{ item.firstName }} {{ item.lastName }}</template
          >
          <template #no-data>
            No users currently added to this group.
          </template>
        </v-data-table>
      </v-col>
      <v-card-actions>
        <v-col class="text-right">
          <v-btn
            data-cy="closeAndDiscardChanges"
            color="primary"
            text
            @click="$emit('close-users-display')"
            >Cancel</v-btn
          >
          <v-btn
            data-cy="closeAndSaveChanges"
            color="primary"
            text
            @click="$emit('close-users-display')"
            >Save</v-btn
          >
        </v-col>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import {ISlimUser} from '@heimdall/interfaces';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import DeleteDialog from '@/components/generic/DeleteDialog.vue';

@Component({
  components: {
    DeleteDialog,
  }
})
export default class GroupUsers extends Vue {
  @Prop({type: Array, required: true}) members!: ISlimUser[];
  @Prop({type: Boolean, required: true}) display!: boolean;

  dialogDelete = false;

  headers: Object[] = [
    {
      text: 'Name',
      value: 'full-name'
    },
    {
      text: 'Email',
      value: 'email'
    },
    {
      text: 'Title',
      value: 'title'
    },
    {
      text: 'Role',
      value: 'groupRole'
    }
  ];
}
</script>
