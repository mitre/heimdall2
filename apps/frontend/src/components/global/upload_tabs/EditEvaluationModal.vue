<template>
  <v-dialog v-model="visible" max-width="1000px">
    <template #activator="{on, attrs}">
      <slot name="clickable" :on="on" :attrs="attrs" />
    </template>

    <v-card data-cy="editEvaluationModal">
      <v-card-title>
        <span class="headline">Edit "{{ activeEvaluation.filename }}"</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="12" sm="7">
              <v-text-field
                v-model="activeEvaluation.filename"
                data-cy="filename"
                label="File name"
              />
            </v-col>
            <v-col cols="12" sm="5">
              <v-select
                v-model="activeEvaluation.public"
                :items="visibilityOptions"
                label="Visibility"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" sm="7" md="9">
              <v-autocomplete
                v-model="groups"
                label="Groups"
                multiple
                deletable-chips
                :items="myGroups"
                :search-input.sync="groupSearch"
                return-object
              >
                <template #no-data>
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title>
                        No results matching "<strong>{{ groupSearch }}</strong
                        >". Press <kbd>Create New Group</kbd> to create one.
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" sm="5" md="3">
              <GroupModal id="groupModal" :create="true">
                <template #clickable="{on, attrs}"
                  ><v-btn
                    block
                    color="primary"
                    class="mt-3"
                    v-bind="attrs"
                    v-on="on"
                  >
                    Create New Group
                  </v-btn>
                </template>
              </GroupModal>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          text
          color="primary"
          data-cy="closeAndDiscardChanges"
          @click="cancel()"
        >
          Cancel
        </v-btn>
        <v-btn
          text
          color="primary"
          data-cy="closeAndSaveChanges"
          @click="update()"
          >Save</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Modal from '@/components/global/Modal.vue'
import {Prop} from 'vue-property-decorator';
import {EvaluationModule} from '@/store/evaluations';
import {IEvaluation, IEvaluationGroup, IGroup} from '@heimdall/interfaces';
import {GroupsModule} from '@/store/groups';
import GroupModal from '@/components/global/groups/GroupModal.vue';
import axios from 'axios';
import {SnackbarModule} from '@/store/snackbar';
import {IVuetifyItems} from '@/utilities/helper_util';


@Component({
  components: {
    Modal,
    GroupModal
  }
})
export default class EditEvaluationModal extends Vue {
  @Prop({type: Object, required: true}) readonly active!: IEvaluation;

  activeEvaluation: IEvaluation = {...this.active};
  originalGroups: IVuetifyItems[] = [];
  groups: IVuetifyItems[] = [];
  groupSearch = '';
  visible = false;

  visibilityOptions: IVuetifyItems[] = [
    {
      text: "Public (all authenticated users on this server)",
      value: true
    },
    {
      text: "Private (owners & groups)",
      value: false
    }
  ]

  mounted() {
    this.getGroupsForEvaluation();
  }

  convertGroupsToIVuetifyItems(groups: IGroup[]): IVuetifyItems[] {
    return groups.map((group) => {
      return {
        text: group.name,
        value: group.id
      }
    })
  }

  get myGroups(): IVuetifyItems[] {
    return this.convertGroupsToIVuetifyItems(GroupsModule.myGroups);
  }

  async getGroupsForEvaluation(): Promise<void> {
    return axios.get<IGroup[]>(`/evaluations/${this.active.id}/groups`).then(({data}) => {
      this.originalGroups = this.groups = this.convertGroupsToIVuetifyItems(data);
    });
  }

  async update(): Promise<void> {
    Promise.all([EvaluationModule.updateEvaluation(this.activeEvaluation), this.updateGroups()]).then(() => {
      SnackbarModule.notify('Evaluation Updated Successfully');
    })
    this.visible = false;
    this.$emit('updateEvaluations')
  }

  cancel(): void {
    this.visible = false;
    this.groups = this.originalGroups;
    this.activeEvaluation = {...this.active};
  }

  async updateGroups(): Promise<void> {
    const toAdd: IVuetifyItems[] = this.groups.filter(group => !this.originalGroups.includes(group));
    const toRemove: IVuetifyItems[] = this.originalGroups.filter(group => !this.groups.includes(group));
    const evaluationGroup: IEvaluationGroup = {
      id: this.active.id
    }

    const addedGroupPromises = toAdd.map((group) => {
      return axios.post(`/groups/${group.value}/evaluation`, evaluationGroup)
    });

    const removeGroupPromises = toRemove.map((group) => {
      return axios.delete(`/groups/${group.value}/evaluation`, {data: evaluationGroup})
    });

    Promise.all(addedGroupPromises.concat(removeGroupPromises))
  }
}
</script>
