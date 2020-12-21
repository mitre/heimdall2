<template>
  <Modal :visible="visible">
    <v-card>
      <v-card-title>
        <span class="headline">Edit "{{ filename }}"</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-text-field v-model="filename" label="File name" />
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
                      label="Tag value"
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
          <v-data-table :headers="headers" :items="tags" disable-sort>
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
                    counter
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
        <v-btn color=" darken-1" text @click="saveEvaluation()">Save</v-btn>
      </v-card-actions>
    </v-card>
  </Modal>
</template>

<script lang="ts">
import Vue from 'vue';
import axios from 'axios';
import Component from 'vue-class-component';
import Modal from '@/components/global/Modal.vue'
import {Prop} from 'vue-property-decorator';
import {IEvaluationTag, ICreateEvaluationTag, IEvaluation} from '@heimdall/interfaces';
import {Snackbar, SnackbarModule} from '@/store/snackbar';
import {EvaluationModule} from '@/store/evaluations';
import { Evaluation } from '@/types/models';
import { ServerModule } from '@/store/server';

@Component({
  components: {
    Modal
  }
})
export default class EditEvaluationModal extends Vue {
  @Prop({default: false}) visible!: boolean;

  newTagDialog: boolean = false;
  deleteTagDialog: boolean = false;
  showSelf: boolean = this.visible;

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

  get filename() {
    return EvaluationModule.activeEvaluation.filename;
  }

  set filename(filename: string) {
    EvaluationModule.setActiveEvaluationFilename(filename);
  }

  get tags() {
    return EvaluationModule.activeEvaluation.evaluationTags;
  }

  get activeTag() {
    return EvaluationModule.activeTag;
  }

  async deleteTag(tag: any) {
    EvaluationModule.deleteTag(tag);
  }

  async updateTag(tag: any) {
    EvaluationModule.updateTag(tag);
  }

  async commitTag(): Promise<void> {
    EvaluationModule.addTagToActiveEvaluation();
    this.newTagDialog = false
  }

  async saveEvaluation(): Promise<void> {
    EvaluationModule.saveEvaluation();
    this.$emit('closeEditModal')
  }
}
</script>
