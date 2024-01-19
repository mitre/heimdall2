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
            deleted any value(s) and press the enter (return) key.
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
      :evaluations-loaded="pagedEvaluations"
      :loading="queryingRecords"
      :total-items-per-page="itemsPerPage"
      :evaluations-count="evaluationsCount"
      @load-selected="load_results($event)"
    />
  </v-container>
</template>

<script lang="ts">
import RefreshButton from '@/components/generic/RefreshButton.vue';
import LoadFileList from '@/components/global/upload_tabs/LoadFileList.vue';
import RouteMixin from '@/mixins/RouteMixin';
import ServerMixin from '@/mixins/ServerMixin';
import {FileID} from '@/store/report_intake';
import {SnackbarModule} from '@/store/snackbar';
import {EvaluationModule} from '@/store/evaluations';
import {SpinnerModule} from '@/store/spinner';
import {IEvalPaginationParams, IEvaluation} from '@heimdall/common/interfaces';
import {Prop, Watch} from 'vue-property-decorator';
import Component, {mixins} from 'vue-class-component';

/**
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {
    LoadFileList,
    RefreshButton
  }
})
export default class DatabaseReader extends mixins(ServerMixin, RouteMixin) {
  @Prop({default: false}) readonly refresh!: boolean;

  isActiveDialog = false;

  headers: Object[] = [
    {
      text: 'Filename',
      value: 'filename',
      align: 'left',
      sortable: true
    },
    {
      text: 'Groups',
      value: 'groups',
      sortable: true
    },
    {
      text: 'Tags',
      value: 'evaluationTags',
      sortable: true
    },
    {text: 'Uploaded', value: 'createdAt', sortable: true},
    {
      text: 'Actions',
      value: 'actions',
      align: 'end',
      sortable: false
    }
  ];

  itemsPerPage = EvaluationModule.limit;

  @Watch('refresh')
  onChildChanged(newRefreshValue: boolean, _oldValue: boolean) {
    if (newRefreshValue === true) {
      // Whenever refresh is set to true, call refresh on the database results
      this.get_all_results();
    }
  }

  mounted() {
    this.get_all_results();
  }

  async get_all_results(): Promise<void> {
    // Cursor is set back to default when the query finishes
    document.body.style.cursor = 'wait';
    const params: IEvalPaginationParams = {
      offset: EvaluationModule.offset,
      limit: this.itemsPerPage,
      order: EvaluationModule.order
    };
    // Stores results in the Evaluation class field pagedEvaluations
    EvaluationModule.getAllEvaluations(params);
  }

  // Loading is initially set to true in Evaluation class.
  // When getAllEvaluations(params) finishes it sets it to false.
  get queryingRecords() {
    return EvaluationModule.loading;
  }

  get pagedEvaluations() {
    return EvaluationModule.pagedEvaluations;
  }

  get evaluationsCount() {
    return EvaluationModule.evaluationsCount;
  }

  // Fires when user selects entries and loads them into the visualization panel
  async load_results(evaluations: IEvaluation[]): Promise<void> {
    if (evaluations.length != 0) {
      SpinnerModule.reset();
      SpinnerModule.visibility(true);
      EvaluationModule.load_results(
        evaluations.map((evaluation) => evaluation.id)
      )
        .then((fileIds: (FileID | void)[]) => {
          this.$emit('got-files', fileIds.filter(Boolean));
        })
        .finally(() => {
          SpinnerModule.visibility(false);
        });
    } else {
      SnackbarModule.notify(
        'Please select an entry for viewing in the visualization panel'
      );
    }
  }
}
</script>
