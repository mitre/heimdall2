<template>
  <Modal :visible="visible" max-width="1000px">
    <v-card>
      <v-card-title>
        <span class="headline">Edit "{{ activeEvaluation.filename }}"</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-row>
            <v-text-field
              v-model="activeEvaluation.filename"
              label="File name"
            />
          </v-row>

          <v-row>
            <v-autocomplete
              label="Groups"
              multiple
              deletable-chips
              :items="myGroups"
              :search-input.sync="groupSearch"
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
            <GroupModal id="groupModal" :create="true">
              <template #clickable="{on, attrs}"
                ><v-btn
                  color="primary"
                  class="mt-3 ml-2"
                  v-bind="attrs"
                  v-on="on"
                >
                  Create New Group
                </v-btn>
              </template>
            </GroupModal>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text color="primary" @click.native="$emit('closeEditModal')">
          Cancel
        </v-btn>
        <v-btn text color="primary" @click="updateEvaluation()">Save</v-btn>
      </v-card-actions>
    </v-card>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Modal from '@/components/global/Modal.vue'
import {Prop} from 'vue-property-decorator';
import {EvaluationModule} from '@/store/evaluations';
import {IEvaluation} from '@heimdall/interfaces';
import {GroupsModule} from '@/store/groups';
import GroupModal from '@/components/global/groups/GroupModal.vue';

interface IVuetifyItems {
  text: string | number | object,
  value: string | number | object,
  disabled?: boolean,
}

@Component({
  components: {
    Modal,
    GroupModal
  }
})
export default class EditEvaluationModal extends Vue {
  @Prop({default: false}) visible!: boolean;
  @Prop({type: Object, required: true}) readonly active!: IEvaluation;

  activeEvaluation: IEvaluation = {...this.active};
  groupSearch: string = '';

  get myGroups(): IVuetifyItems[] {
    return GroupsModule.myGroups.map((group) => {
      return {
        text: group.name,
        value: group.id
      }
    })
  }

  async updateEvaluation(): Promise<void> {
    await EvaluationModule.updateEvaluation(this.activeEvaluation);
    this.$emit('closeEditModal')
    this.$emit('updateEvaluations')
  }
}
</script>
