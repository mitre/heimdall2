<template>
  <v-container class="mx-0 px-0" fluid>
    <v-row class="pt-2" justify="space-between">
      <v-card-subtitle>
        View files maintained (stored) in the Heimdall Server backend database.
      </v-card-subtitle>

      <v-btn
        class="mr-8 ml-2 mt-2"
        icon
        small
        style="cursor: pointer"
        @click="isActiveDialog = true"
      >
        <v-icon b-tooltip.hover title="Search Instructions" color="primary">
          mdi-information-outline
        </v-icon>
      </v-btn>

      <v-dialog v-model="isActiveDialog" persistent width="500">
        <v-card>
          <v-card-title>Search Instructions</v-card-title>
          <v-card-text>
            Values to be search don't need to match exactly, if searching for a
            file name "compliant_audit_scan.nessus", the input value can be any
            part of the name. This applies to all fields regardless of the logic
            selected. When searching for a Tag value, the search return includes
            all tags associated with the matching evaluation. Search logic can
            be inclusive or exclusive. The following table provides the expected
            outcomes base on the logic selected.
            <v-simple-table fixed-header>
              <template #default>
                <thead>
                  <tr>
                    <th class="text-left text-h6">Logic</th>
                    <th class="text-left text-h6">Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>AND</td>
                    <td>
                      Values provided in the search fields (file, group, or tag
                      name) are logically inclusive, there is, all field values
                      provided must be evaluated to true for a record to be
                      returned.
                    </td>
                  </tr>
                  <tr>
                    <td>OR</td>
                    <td>
                      Values provided in the search fields (file, group, or tag
                      name) are not logically inclusive, there is, any value
                      provided evaluates to true, records matching the field
                      value provided are returned.
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
            <br />
            <b>NOTE:</b>
            To clear the search fields, either click the clear icon (X) or
            delete any value(s) and press the enter (return) key.
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="isActiveDialog = false">Close Dialog</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-row>

    <LoadFileList
      :headers="headers"
      @load-selected="load_results($event)"
    />
  </v-container>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import LoadFileList from '@/components/global/upload_tabs/LoadFileList.vue';
import {EvaluationModule} from '@/store/evaluations';
import {SpinnerModule} from '@/store/spinner';
import {SnackbarModule} from '@/store/snackbar';
import type {FileID} from '@/store/report_intake';
import type {IEvaluation} from '@heimdall/common/interfaces';

export default defineComponent({
  name: 'DatabaseReader',
  components: {LoadFileList},
  props: {
    refresh: {type: Boolean, default: false},
  },
  emits: ['got-files'],
  setup(props, {emit}) {
    const isActiveDialog = ref(false);

    const headers = [
      {text: 'Filename', value: 'filename', align: 'left', sortable: true},
      {text: 'Groups', value: 'groups', sortable: true},
      {text: 'Tags', value: 'evaluationTags', sortable: true},
      {text: 'Uploaded', value: 'createdAt', sortable: true},
      {text: 'Actions', value: 'actions', align: 'end', sortable: false},
    ];

    async function load_results(evaluations: IEvaluation[]) {
      if (evaluations.length === 0) {
        SnackbarModule.notify(
          'Please select an entry for viewing in the visualization panel',
        );
        return;
      }
      SpinnerModule.reset();
      SpinnerModule.visibility(true);
      try {
        const fileIds: (FileID | void)[] = await EvaluationModule.load_results(
          evaluations.map((evaluation) => evaluation.id),
        );
        emit('got-files', fileIds.filter(Boolean));
      } finally {
        SpinnerModule.visibility(false);
      }
    }

    return {isActiveDialog, headers, load_results};
  },
});
</script>
