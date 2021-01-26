<template>
  <Modal :visible="visible" width="50%">
    <v-card>
      <v-card-title>
        <span class="headline">Edit "{{ activeEvaluation.filename }}"</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-text-field v-model="activeEvaluation.filename" label="File name" />
          <v-divider class="pb-2" />
          <v-dialog v-model="deleteTagDialog" max-width="500px">
            <v-card>
              <v-card-title class="headline"
                >Are you sure you want to delete this tag?</v-card-title
              >
              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="blue darken-1"
                  text
                  @click="deleteTagDialog = false"
                  >Cancel</v-btn
                >
                <v-btn color="blue darken-1" text @click="deleteTagConfirm()"
                  >OK</v-btn
                >
                <v-spacer />
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-dialog v-model="newTagDialog" max-width="500px">
            <template #activator="{on, attrs}">
              <v-row class="d-flex flex-row-reverse">
                <v-btn color="primary" v-bind="attrs" v-on="on">
                  New Tag
                </v-btn>
              </v-row>
            </template>
            <v-card>
              <v-card-title>
                <span class="headline">Add a tag</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-col>
                    <v-text-field
                      v-model="activeTag.value"
                      label="Tag Name"
                      @keyup.enter="commitTag()"
                    />
                  </v-col>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn color="blue darken-1" text @click="newTagDialog = false">
                  Cancel
                </v-btn>
                <v-btn color="blue darken-1" text @click="commitTag()">
                  Save
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-data-table
            :headers="headers"
            :items="activeEvaluation.evaluationTags"
            disable-sort
          >
            <template #[`item.value`]="{item}">
              <v-edit-dialog
                :return-value.sync="item.value"
                large
                @save="updateTag(item)"
              >
                <div>{{ item.value }}</div>
                <template #input>
                  <div class="mt-4 title">Update {{ item.value }}</div>
                  <v-text-field
                    v-model="item.value"
                    label="Edit"
                    single-line
                    autofocus
                  />
                </template>
              </v-edit-dialog>
            </template>
            <template #[`item.actions`]="{item}">
              <v-icon small @click="deleteTag(item)">mdi-delete</v-icon>
            </template>
          </v-data-table>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="blue darken-1"
          text
          blue
          @click.native="$emit('closeEditModal')"
        >
          Cancel
        </v-btn>
        <v-btn color="darken-1" text @click="updateEvaluation()">Save</v-btn>
      </v-card-actions>
    </v-card>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import Modal from '@/components/global/Modal.vue'
import {Prop} from 'vue-property-decorator';
import {SnackbarModule} from '@/store/snackbar';
import {EvaluationModule} from '@/store/evaluations';
import {IEvaluation} from '@heimdall/interfaces';
import axios from 'axios';

@Component({
  components: {
    Modal
  }
})
export default class EditEvaluationModal extends Vue {
  @Prop({default: false}) visible!: boolean;
  @Prop({type: Object, required: true}) readonly active!: IEvaluation;

  newTagDialog: boolean = false;
  deleteTagDialog: boolean = false;
  awaitingFinishTyping: boolean = false;
  activeTag: any = {
    id: '-1',
    value: ''
  };
  activeEvaluation: IEvaluation = {...this.active}

  headers: Object[] = [
    {
      text: 'Tag',
      value: 'value'
    },
    {
      text: 'Actions',
      value: 'actions'
    }
  ];

  async deleteTag(tag: any) {
    await axios.delete(`/evaluation-tags/${tag.id}`).then((response) => {
      this.activeEvaluation.evaluationTags!.splice(
        this.activeEvaluation.evaluationTags!.indexOf(tag),
        1
      )
      SnackbarModule.notify("Deleted tag successfully.")
    }).catch((error) => {
      SnackbarModule.HTTPFailure(error)
    });
  }

  async updateTag(tag: any) {
    EvaluationModule.updateTag(tag).then((response) => {
      SnackbarModule.notify("Updated tag successfully.")
    }).catch((error) => {
      SnackbarModule.HTTPFailure(error)
    });
  }

  async commitTag(): Promise<void> {
    axios.post(`/evaluation-tags/${this.activeEvaluation.id}`, this.activeTag).then((response) => {
      this.activeEvaluation.evaluationTags?.push(response.data)
      SnackbarModule.notify("Created tag successfully.")
    })
    this.newTagDialog = false
  }

  async updateEvaluation(): Promise<void> {
    await EvaluationModule.updateEvaluation(this.activeEvaluation);
    this.$emit('closeEditModal')
    this.$emit('updateEvaluations')
  }
}
</script>
