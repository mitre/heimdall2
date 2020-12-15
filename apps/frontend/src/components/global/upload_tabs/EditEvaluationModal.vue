<template>
  <Modal :visible="visible">
    <v-card>
      <v-card-title>
        <span class="headline">Edit "{{ activeItem.filename }}"</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-text-field v-model="activeItem.filename" label="File name" />
          <v-divider class="pb-2" />
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
                    <v-text-field v-model="newTag.key" label="Tag name" />
                  </v-col>
                  <v-col>
                    <v-text-field v-model="newTag.value" label="Tag value" />
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
          <v-data-table :headers="headers" :items="activeItem.evaluationTags">
            <template #[`item.key`]="{item}">
              <v-edit-dialog
                :return-value.sync="item.key"
                large
                @save="saveTag(item)"
              >
                <div>{{ item.key }}</div>
                <template #input>
                  <div class="mt-4 title">Update {{ item.key }}</div>
                  <v-text-field
                    v-model="item.key"
                    label="Edit"
                    single-line
                    counter
                    autofocus
                  />
                </template>
              </v-edit-dialog>
            </template>
            <template #[`item.value`]="{item}">
              <v-edit-dialog
                :return-value.sync="item.value"
                large
                @save="saveTag(item)"
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
import {IEvaluationTag, ICreateEvaluationTag} from '@heimdall/interfaces';
import {SnackbarModule} from '@/store/snackbar';

@Component({
  components: {
    Modal
  }
})
export default class EditEvaluationModal extends Vue {
  @Prop({default: false}) visible!: boolean;
  @Prop({default: {}}) activeItem: any;

  newTagDialog: boolean = false;
  newTag: ICreateEvaluationTag = {
    key: '',
    value: ''
  };
  // Table Headers
  headers: Object[] = [
    {
      text: 'Tag',
      value: 'key'
    },
    {
      text: 'Value',
      value: 'value'
    }
  ];

  async saveTag(item: IEvaluationTag): Promise<void> {
    console.log(item)
    axios.put(`/evaluation-tags/${item.id}`, item).then((response) => {
      SnackbarModule.notify('Updated tag successfully.')
    }).catch((error) => {
      SnackbarModule.notify(error.response.data.message);
      if (typeof error.response.data.message === 'object') {
        SnackbarModule.notify(
          error.response.data.message
            .map(function capitalize(c: string) {
              return c.charAt(0).toUpperCase() + c.slice(1);
            }).join(', ')
        );
      }
      else {
        SnackbarModule.notify(error.response.data.message);
      };
    });
  }

  async saveEvaluation(): Promise<void> {
    axios.put(`/evaluations/${this.activeItem.id}`, this.activeItem).then((response) => {
      SnackbarModule.notify('Updated evaluation successfully.');
      this.$emit('closeEditModal')
    }).catch((error) => {
      SnackbarModule.notify(error.response.data.message);
      if (typeof error.response.data.message === 'object') {
        SnackbarModule.notify(
          error.response.data.message
            .map(function capitalize(c: string) {
              return c.charAt(0).toUpperCase() + c.slice(1);
            })
          .join(', ')
        );
      }
      else {
        SnackbarModule.notify(error.response.data.message);
      };
    });
  }

  async commitTag(): Promise<void> {
    axios.post(`/evaluation-tags/${this.activeItem.id}`, this.newTag).then((response) => {
      console.log(response);
    })
    this.activeItem.evaluationTags.push(this.newTag);
    this.newTagDialog = false
  }
}
</script>
