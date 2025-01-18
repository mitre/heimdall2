<template>
  <v-dialog v-model="visible" persistent max-width="1000px">
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
import GroupModal from '@/components/global/groups/GroupModal.vue';
import Modal from '@/components/global/Modal.vue';
import {EvaluationModule} from '@/store/evaluations';
import {GroupsModule} from '@/store/groups';
import {SnackbarModule} from '@/store/snackbar';
import {IVuetifyItems} from '@/utilities/helper_util';
import {IEvaluation, IEvaluationGroup} from '@heimdall/common/interfaces';
import axios from 'axios';
import Component, {mixins} from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import EvaluationMixin from '../../../mixins/EvaluationMixin';

@Component({
  components: {
    Modal,
    GroupModal
  }
})
export default class EditEvaluationModal extends mixins(EvaluationMixin) {
  @Prop({type: Object, required: true}) readonly active!: IEvaluation;
  @Prop({default: true}) readonly visible!: boolean;

  activeEvaluation: IEvaluation = {...this.active};
  originalGroups: IVuetifyItems[] = [];
  groups: IVuetifyItems[] = [];
  groupSearch = '';

  visibilityOptions: IVuetifyItems[] = [
    {
      text: 'Public (all authenticated users on this server)',
      value: true
    },
    {
      text: 'Private (owners & groups)',
      value: false
    }
  ];

  mounted() {
    this.getGroupsForEvaluation();
  }

  get myGroups(): IVuetifyItems[] {
    return this.convertGroupsToIVuetifyItems(GroupsModule.myGroups);
  }

  async getGroupsForEvaluation(): Promise<void> {
    this.originalGroups = this.groups = this.convertGroupsToIVuetifyItems(
      this.active.groups
    );
  }

  async update(): Promise<void> {
    Promise.all([
      EvaluationModule.updateEvaluation(this.activeEvaluation),
      this.updateGroups()
    ]).then(() => {
      SnackbarModule.notify('Evaluation Updated Successfully');
      EvaluationModule.loadEvaluation(this.active.id);
    });
    this.$emit('close');
  }

  cancel(): void {
    this.$emit('close');
    this.groups = this.originalGroups;
    this.activeEvaluation = {...this.active};
  }

  async updateGroups(): Promise<void> {
    const toAdd: IVuetifyItems[] = this.groups.filter(
      (group) => !this.originalGroups.includes(group)
    );
    const toRemove: IVuetifyItems[] = this.originalGroups.filter(
      (group) => !this.groups.includes(group)
    );
    const evaluationGroup: IEvaluationGroup = {
      id: this.active.id
    };

    const addedGroupPromises = toAdd.map((group) => {
      return axios.post(`/groups/${group.value}/evaluation`, evaluationGroup);
    });

    const removeGroupPromises = toRemove.map((group) => {
      return axios.delete(`/groups/${group.value}/evaluation`, {
        data: evaluationGroup
      });
    });

    Promise.all(addedGroupPromises.concat(removeGroupPromises));
  }
}
</script>
