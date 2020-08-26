<template>
  <v-stepper-content step="2">
    <div class="d-flex flex-column">
      <v-data-table
        :headers="headers"
        item-key="guid"
        :items="items"
        :search="search"
        :items-per-page="5"
      >
        <template v-slot:top>
          <v-toolbar>
            <v-toolbar-title>Splunk Executions</v-toolbar-title>
            <v-divider class="mx-4" inset vertical></v-divider>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              append-icon="search"
              label="Search"
              single-line
              hide-details
            ></v-text-field>
          </v-toolbar>
        </template>
        <template v-slot:item.action="{item}">
          <v-icon @click="load_event(item)">
            mdi-plus-circle
          </v-icon>
        </template>
        <template v-slot:no-data>
          No data. Try relaxing your search conditions, or expanding the date
          range.
        </template>
      </v-data-table>
      <v-btn color="red" @click="logout" class="my-2">
        Logout
      </v-btn>
    </div>
  </v-stepper-content>
</template>

<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import {
  FileID,
  next_free_file_ID,
  EvaluationFile,
  SourcedContextualizedEvaluation
} from '@/store/report_intake';
import {
  SplunkEndpoint,
  ExecutionMetaInfo,
  SplunkErrorCode
} from '@/utilities/splunk_util';
import {InspecDataModule} from '@/store/data_store';
import {contextualizeEvaluation} from 'inspecjs/dist/context';

const SEARCH_INTERVAL = 10000;

const Props = Vue.extend({
  props: {
    endpoint: Object // Of type SplunkEndpoint. Can be null, but shouldn't be!
  }
});

@Component({
  components: {}
})
export default class FileList extends Props {
  /** The name written in the form */
  search: string = '';

  /** Table info */
  headers = [
    {
      text: 'Filename',
      value: 'filename',
      filterable: true,
      align: 'start'
    },
    {
      text: 'Time',
      value: 'start_time'
    },
    {
      text: 'Action',
      value: 'action',
      sortable: false
    }
  ];

  /** Currently fetch'd executions */
  items: ExecutionMetaInfo[] = [];

  /** Typed getter for endpoint */
  get _endpoint(): SplunkEndpoint | null {
    if (this.endpoint == null) {
      return null;
    }
    return this.endpoint as SplunkEndpoint;
  }

  /** Callback for when user selects a file.
   * Loads it into our system.
   * We assume we're auth'd if this is called
   */
  async load_event(event: ExecutionMetaInfo): Promise<void> {
    // Get it out of the list
    //let event = (null as unknown) as ExecutionMetaInfo;

    // Get its full event list and reconstruct
    return this._endpoint!.get_execution(event.guid)
      .then(exec => {
        let unique_id = next_free_file_ID();
        let file = {
          unique_id,
          filename: `${event.filename} (Splunk)`
          // execution: contextualized
        } as EvaluationFile;
        let contextualized: SourcedContextualizedEvaluation = {
          ...contextualizeEvaluation(exec),
          from_file: file
        };
        file.evaluation = contextualized;
        Object.freeze(contextualized);

        InspecDataModule.addExecution(file);
        this.$emit('got-files', [unique_id]);
      })
      .catch(fail => {
        this.$emit('error', fail);
      });
  }

  /** Passively searches */
  searcher!: NodeJS.Timeout;

  /** When we should next search. If curr time > this, then search*/
  next_search_time: number = 0;

  /** Are we already searching? Track here */
  already_searching: boolean = false;

  /** Updates search results, if it is appropriate to do so */
  search_poller() {
    if (!this._endpoint) {
      return;
    }

    let curr_time = new Date().getTime();
    if (curr_time > this.next_search_time && !this.already_searching) {
      // As an initial venture, try again in 60 seconds. See below for our actual expected search
      this.next_search_time = curr_time + 60000;

      // Then do the search
      this.already_searching = true;
      this._endpoint
        .fetch_execution_list()
        .then(l => {
          // On success, save the items
          this.items = l;

          // Mark search done
          this.already_searching = false;

          // And make the next try sometime sooner than the previous attempt
          this.next_search_time = Math.min(
            curr_time + SEARCH_INTERVAL,
            this.next_search_time
          );
        })
        .catch(error => {
          this.items = [];
          this.already_searching = false;
          this.$emit('error', error);
        });
    }
  }

  logout() {
    this.$emit('exit-list');
    this.items = [];
  }

  /** Used for timer functions */
  last_search_time: number = 0;
  time_since_last_search(): number {
    return new Date().getTime();
  }

  // Init search timers
  mounted() {
    this.searcher = setInterval(this.search_poller, 1000);
  }

  // Clear timer on destroy as well
  beforeDestroy() {
    if (this.searcher) {
      clearInterval(this.searcher);
    }
  }
}
</script>
