<template>
  <Modal :visible="visible">
    <v-card>
      <v-card-title>
        <span class="headline">Edit "{{ activeItem.filename }}"</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <v-text-field v-model="activeItem.filename" label="File name" />
          <v-data-table :headers="headers" :items="activeItem.evaluationTags">
            <template #[`item.key`]="{item}">
              <v-edit-dialog
                :return-value.sync="item.key"
                large
                @save="save(item)"
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
                @save="save(item)"
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
        <v-btn color="blue darken-1" text @click="visible = false">
          Cancel
        </v-btn>
        <v-btn color="blue darken-1" text @click="save">Save</v-btn>
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
import {IEvaluationTag} from '@heimdall/interfaces';
import {SnackbarModule} from '@/store/snackbar';

@Component({
  components: {
    Modal
  }
})
export default class EditEvaluationModal extends Vue {
    @Prop({default: false}) readonly visible!: boolean;
    @Prop({default: -1}) readonly activeIndex!: number;
    @Prop({default: {}}) readonly activeItem: any;

    activeTagID: number = -1;
    headers: Object[] = [
    {
      text: 'Key',
      value: 'key'
    },
    {
      text: 'Value',
      value: 'value'
    }
  ];

    async save(item: IEvaluationTag): Promise<void> {
      axios.put(`/evaluation-tags/${item.id}`, item).then((response) => {
        SnackbarModule.notify('Updated tag successfully.')
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
}
</script>
