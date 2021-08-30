<template>
  <v-dialog v-model="showingModal" width="580">
    <template #activator="{on}">
      <LinkItem
        key="export_ckl"
        text="Export as Checklist"
        icon="mdi-language-html5"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Export as Checklist </v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <v-text-field label="Hostname" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Cancel </v-btn>
        <v-btn color="primary" text @click="exportCKL">
          Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import axios from 'axios';
import { ContextualizedControl } from 'inspecjs';
import Mustache from 'mustache';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop} from 'vue-property-decorator';
import {Filter} from '../../store/data_filters';
import { InspecDataModule } from '../../store/data_store';
import {EvaluationFile, ProfileFile} from '../../store/report_intake';
import {SnackbarModule} from '../../store/snackbar';

interface ControlSet {
  filename: string;
  fileID: string;
  controls: ContextualizedControl[];
}

interface OutputData {
  controlSets: ControlSet[];
}

@Component({
  components: {
    LinkItem
  }
})
export default class ExportCKLModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  showingModal = false;
  outputData: OutputData = {
    controlSets: []
  };

  /**
   * Invoked when file(s) are loaded.
   */
  closeModal() {
    this.showingModal = false;
  }

  showModal() {
    this.showingModal = true;
  }

  addFiledata(file: EvaluationFile | ProfileFile) {
    console.log(file)
  }

  exportCKL(): void {
    if (this.filter.fromFile.length === 0) {
      return SnackbarModule.failure('No files have been loaded.');
    }
    // template 
    axios.get(`/static/export/cklExport.ckl`).then(({data}) => {
      console.log(data);
      
      this.filter.fromFile.forEach(async (fileId) => {
          const file = InspecDataModule.allFiles.find(
              (f) => f.uniqueId === fileId
          );
          if (file) {
              this.addFiledata(file);
          }
      });      
      
      const body = Mustache.render(data, this.outputData);
    });

    this.closeModal();
  }
}
</script>