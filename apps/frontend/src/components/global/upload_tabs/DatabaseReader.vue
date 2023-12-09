<template>
  <v-container class="mx-0 px-0" fluid style="height: 80vh">
    <v-card-subtitle>
      View files maintained (stored) in the Heimdall Server backend database.
    </v-card-subtitle>
      <LoadFileList3
        :headers="headers"
        :files="files"
        :queryingRecords="loading"
        :totalItemsPerPage="itemsPerPage"
        @load-selected="load_results($event)"
      />
  </v-container>
</template>

<script lang="ts">
import RefreshButton from '@/components/generic/RefreshButton.vue';
import LoadFileList3 from '@/components/global/upload_tabs/LoadFileList3.vue';
import RouteMixin from '@/mixins/RouteMixin';
import ServerMixin from '@/mixins/ServerMixin';
import {EvaluationModule} from '@/store/evaluations';
import {FileID} from '@/store/report_intake';
import {IEvalPaginationParams, IEvaluation, IEvaluationTag, IGroup} from '@heimdall/interfaces';
import Component, {mixins} from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
import {SnackbarModule} from '@/store/snackbar';

/**
 * Uploads data to the store with unique IDs asynchronously as soon as data is entered.
 * Emits "got-files" with a list of the unique_ids of the loaded files.
 */
@Component({
  components: {
    LoadFileList3,
    RefreshButton
  }
})
export default class DatabaseReader extends mixins(ServerMixin, RouteMixin) {
  @Prop({default: false}) readonly refresh!: boolean;

  headers: Object[] = [
    {
      text: 'Filename',
      value: 'filename',
      align: 'start',
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
      sortable: false,
    }
  ];

  itemsPerPage = 50;

  @Watch('refresh')
  onChildChanged(newRefreshValue: boolean, _oldValue: boolean) {
    if (newRefreshValue === true) {
      // Whenever refresh is set to true, call refresh on the database results
      this.get_all_results();
    }
  }

  mounted() {
    //this.get_all_results();
  }

  
  async get_all_results(): Promise<void> {
    console.log('---------------- START -----------------')
    console.log('DATABASEREADER.VUE: Calling EvaluationModule.getAllEvaluations()')
    
    //EvaluationModule.getAllEvaluations();
    const params: IEvalPaginationParams = {offset: 1, limit: this.itemsPerPage, order: ["createdAt", "DESC"]};
console.log(`params are: ${JSON.stringify(params,null,2)}`)    
    // Stores results in the Evaluation class field allEvaluations 
    EvaluationModule.getAllEvaluations(params);
  }

  // Loading is initially set to true in Evaluation class.
  // When EvaluationModule.getAllEvaluations(params) finished it sets it to false.
  get loading() {
    return true;
    //return EvaluationModule.loading;
  }

  get files() {
    console.log("GETTING ALL EVALUATIONS")
    console.log(`totalItems are: ${this.tempFiles.length}`)
    //return EvaluationModule.allEvaluations;
    return this.tempFiles;
  }

  // Fires when user selects entries and loads them into the visualization panel
  load_results(evaluations: IEvaluation[]): void {
    console.log(`DATABASEREADER.VUE: load_results(evaluations) - evaluations are: ${JSON.stringify(evaluations,null,2)}`)
    if (evaluations.length != 0) {
      EvaluationModule.load_results(
        evaluations.map((evaluation) => evaluation.id)
      ).then((fileIds: (FileID | void)[]) => {
        console.log(`emitting got-files(fileIds): ${fileIds}`)
        this.$emit('got-files', fileIds.filter(Boolean));
      });
    } else {
      SnackbarModule.notify("Please select an evaluation for viewing in the visualization panel!")
    }
  }

  activeTag1: IEvaluationTag = {
    id: '1',
    value: 'Tag-1',
    evaluationId: '',
    createdAt: new Date("2023-11-07T03:20:59.683Z"),
    updatedAt: new Date("2023-11-07T03:20:59.683Z")
  }
  activeTag2: IEvaluationTag = {
    id: '2',
    value: 'Tag-2',
    evaluationId: '',
    createdAt: new Date("2023-11-07T03:20:59.683Z"),
    updatedAt: new Date("2023-11-07T03:20:59.683Z")
  }
  activeTag3: IEvaluationTag = {
    id: '3',
    value: 'Tag-3',
    evaluationId: '',
    createdAt: new Date("2023-11-07T03:20:59.683Z"),
    updatedAt: new Date("2023-11-07T03:20:59.683Z")
  }
  activeTag4: IEvaluationTag = {
    id: '4',
    value: 'Tag-4',
    evaluationId: '',
    createdAt: new Date("2023-11-07T03:20:59.683Z"),
    updatedAt: new Date("2023-11-07T03:20:59.683Z")
  }
  activeTag5: IEvaluationTag = {
    id: '5',
    value: 'Tag-5',
    evaluationId: '',
    createdAt: new Date("2023-11-07T03:20:59.683Z"),
    updatedAt: new Date("2023-11-07T03:20:59.683Z")
  }
  group1: IGroup = {
    id: '1',
    name: 'Group-1',
    public: false,
    users: [],
    desc: '',
    createdAt: new Date("2023-11-07T03:20:59.683Z"),
    updatedAt: new Date("2023-11-07T03:20:59.683Z")
  }
  group2: IGroup = {
    id: '2',
    name: 'Group-2',
    public: false,
    users: [],
    desc: '',
    createdAt: new Date("2023-11-07T03:20:59.683Z"),
    updatedAt: new Date("2023-11-07T03:20:59.683Z")
  }
  group3: IGroup = {
    id: '3',
    name: 'Group-3',
    public: false,
    users: [],
    desc: '',
    createdAt: new Date("2023-11-07T03:20:59.683Z"),
    updatedAt: new Date("2023-11-07T03:20:59.683Z")
  }
  tempFiles: IEvaluation[] = [
  {
    "id": "20",
    "filename": "snyk-legacy-1.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T03:20:59.683Z"),
    "updatedAt": new Date("2023-11-07T03:20:59.683Z"),
    "editable": true
  },
  {
    "id": "19",
    "filename": "snyk-legacy-2.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T03:20:59.324Z"),
    "updatedAt": new Date("2023-11-07T03:20:59.324Z"),
    "editable": true
  },
  {
    "id": "18",
    "filename": "snyk-legacy-3.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T03:20:59.014Z"),
    "updatedAt": new Date("2023-11-07T03:20:59.014Z"),
    "editable": true
  },
  {
    "id": "17",
    "filename": "snyk-legacy-4.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T03:20:58.655Z"),
    "updatedAt": new Date("2023-11-07T03:20:58.655Z"),
    "editable": true
  },
  {
    "id": "16",
    "filename": "snyk-legacy.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T03:20:58.343Z"),
    "updatedAt": new Date("2023-11-07T03:20:58.343Z"),
    "editable": true
  },
  {
    "id": "15",
    "filename": "snyk-legacy.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T03:20:57.811Z"),
    "updatedAt": new Date("2023-11-07T03:20:57.811Z"),
    "editable": true
  },
  {
    "id": "14",
    "filename": "snyk-legacy.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T03:20:57.295Z"),
    "updatedAt": new Date("2023-11-07T03:20:57.295Z"),
    "editable": true
  },
  {
    "id": "13",
    "filename": "snyk-legacy.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T03:20:56.451Z"),
    "updatedAt": new Date("2023-11-07T03:20:56.451Z"),
    "editable": true
  },
  {
    "id": "12",
    "filename": "snyk-legacy.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T03:20:54.718Z"),
    "updatedAt": new Date("2023-11-07T03:20:54.718Z"),
    "editable": true
  },
  {
    "id": "11",
    "filename": "snyk-legacy-10.hdf",
    "evaluationTags": [],
    "groups": [],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T02:03:47.986Z"),
    "updatedAt": new Date("2023-11-07T02:03:47.986Z"),
    "editable": true
  },
  {
    "id": "10",
    "filename": "this-in-one-loge-file-name-snyk-legacy-10.hdf",
    "evaluationTags": [this.activeTag1,this.activeTag2,this.activeTag3,this.activeTag4,this.activeTag5],
    "groups": [this.group1, this.group3,this.group3],
    "userId": "2",
    "groupId": "",
    "public": false,
    "createdAt": new Date("2023-11-07T02:03:47.986Z"),
    "updatedAt": new Date("2023-11-07T02:03:47.986Z"),
    "editable": true
  }
]
}
</script>
