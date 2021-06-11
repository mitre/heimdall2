<template>
  <v-dialog v-model="showingModal" width="580">
    <template #activator="{on}">
      <LinkItem
        key="export_html"
        text="Export as HTML"
        icon="mdi-language-html5"
        @click="showModal"
        v-on="on"
      />
    </template>
    <v-card>
      <v-card-title class="headline"> Export as HTML </v-card-title>
      <v-card-text>
        <v-row>
          <v-col>
            <v-radio-group v-model="exportType">
              <v-radio label="Executive Report" value="executive" />
              <v-radio label="Manager Report" value="manager" />
              <v-radio label="Administrator Report" value="administrator" />
            </v-radio-group>
          </v-col>
          <v-col>
            <pre class="pt-5" v-text="description" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeModal"> Cancel </v-btn>
        <v-btn color="primary" :disabled="!exportType" text @click="exportHTML">
          Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import Vue from 'vue';
import {Filter, FilteredDataModule} from '../../store/data_filters';
import {Prop, Watch} from 'vue-property-decorator';
import {SnackbarModule} from '../../store/snackbar';
import {InspecDataModule} from '../../store/data_store';
import axios from 'axios';
import _ from 'lodash';
import {StatusCountModule} from '../../store/status_counts';
import {EvaluationFile, ProfileFile} from '../../store/report_intake';
import {ContextualizedControl} from 'inspecjs/dist/context';
import {mdiAlertCircle, mdiCheckCircle, mdiCloseCircle, mdiMinusCircle, mdiDownload} from '@mdi/js'
import Mustache from 'mustache';

interface Detail {
  name: string;
  value: string;
  class?: string;
}

interface FileInfo {
  filename: string;
  toolVersion: string;
  platform: string;
  duration: string;
}

interface ControlSet {
  filename: string;
  fileID: string;
  controls: (ContextualizedControl & {details: Detail[]})[];
}

interface Statistics {
  passed: number;
  failed: number;
  notApplicable: number;
  notReviewed: number;
  passedTests: number;
  passingTestsFailedControl: number;
  failedTests: number;
  totalTests: number;
}

interface Icons {
  [key: string]: string
}

interface OutputData {
  style: string;
  files: FileInfo[];
  statistics: Statistics;
  controlSets: ControlSet[];
  showControlSets: boolean;
  showCode: boolean;
  exportType: string;
  icons: Icons
}

@Component({
  components: {
    LinkItem
  }
})
export default class ExportHTMLModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;
  // If we are exporting a profile we can remove the test/results table
  @Prop({type: String, required: true}) readonly fileType!: string;

  showingModal = false;
  exportType = 'executive';
  description = 'Profile Info\nStatuses\nCompliance Donuts';
  outputData: OutputData = {
    style: '',
    statistics: {
      passed: StatusCountModule.countOf(this.filter, 'Passed'),
      failed: StatusCountModule.countOf(this.filter, 'Failed'),
      notApplicable: StatusCountModule.countOf(this.filter, 'Not Applicable'),
      notReviewed: StatusCountModule.countOf(this.filter, 'Not Reviewed'),
      passedTests: StatusCountModule.countOf(this.filter, 'PassedTests'),
      passingTestsFailedControl: StatusCountModule.countOf(this.filter, 'PassingTestsFailedControl'),
      failedTests: StatusCountModule.countOf(this.filter, 'FailedTests'),
      totalTests: StatusCountModule.countOf(this.filter, 'PassingTestsFailedControl') + StatusCountModule.countOf(this.filter, 'FailedTests')
    },
    files: [],
    controlSets: [],
    showControlSets: false,
    showCode: false,
    exportType: '',
    icons: {
      circleCheck: this.iconDatatoSVG(mdiCheckCircle, 'white'),
      circleCross: this.iconDatatoSVG(mdiCloseCircle, 'white'),
      circleMinus: this.iconDatatoSVG(mdiMinusCircle, 'white'),
      circleAlert: this.iconDatatoSVG(mdiAlertCircle, 'white'),
      download: this.iconDatatoSVG(mdiDownload, 'black')
    }
  };

  @Watch('exportType')
  onFileChanged(newValue: string, _oldValue: string) {
    switch (newValue) {
      case 'executive':
        this.description = "Profile Info\nStatuses\nCompliance Donuts";
        this.outputData.showControlSets = false;
        this.outputData.showCode = false;
        break;
      case 'manager':
        this.description = "Profile Info\nStatuses\nCompliance Donuts\nTest Results and Details";
        this.outputData.showControlSets = true;
        this.outputData.showCode = false;
        break;
      case 'administrator':
        this.description = "Profile Info\nStatuses\nCompliance Donuts\nTest Results and Details\nTest Code";
        this.outputData.showControlSets = true;
        this.outputData.showCode = true;
        break
    }
  }

  iconDatatoSVG(iconData: string, fill: string, widthPx = 24, heightPx = 24): string {
    return `<svg style="width:${widthPx}px; height:${heightPx}px" viewBox="0 0 ${widthPx} ${heightPx}"><path fill="${fill}" d="${iconData}"/></svg>`
  }

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
    this.outputData.files.push({
      filename: file.filename,
      toolVersion: _.get(file, 'evaluation.data.version'),
      platform: _.get(file, 'evaluation.data.platform.name'),
      duration: _.get(file, 'evaluation.data.statistics.duration')
    })
    this.outputData.exportType = _.capitalize(this.exportType)
    const controls = FilteredDataModule.controls({...this.filter, fromFile: [file.unique_id]});
    const controlRoots: ContextualizedControl[] = []
    const hitIds = new Set();
    // Convert them into rows
    for (const ctrl of controls) {
      const root = ctrl.root;
      if (!hitIds.has(root.hdf.wraps.id)) {
        hitIds.add(root.hdf.wraps.id);
        controlRoots.push(root);
      }
    }
    this.outputData.controlSets.push({
      filename: file.filename,
      fileID: file.unique_id,
      controls: controlRoots.map((control) => this.addDetails(control))
    })
  }

  resetOutputData() {
    this.outputData.statistics = {
        passed: StatusCountModule.countOf(this.filter, 'Passed'),
        failed: StatusCountModule.countOf(this.filter, 'Failed'),
        notApplicable: StatusCountModule.countOf(this.filter, 'Not Applicable'),
        notReviewed: StatusCountModule.countOf(this.filter, 'Not Reviewed'),
        passedTests: StatusCountModule.countOf(this.filter, 'PassedTests'),
        passingTestsFailedControl: StatusCountModule.countOf(this.filter, 'PassingTestsFailedControl'),
        failedTests: StatusCountModule.countOf(this.filter, 'FailedTests'),
        totalTests: StatusCountModule.countOf(this.filter, 'PassingTestsFailedControl') + StatusCountModule.countOf(this.filter, 'FailedTests')
    }
    this.outputData.files = []
    this.outputData.controlSets = []
  }

   copyComplianceCards(exportWindow: Window) {
    // Grab the html from Heimdall, and then grab the container that the html will be put into
    const statusCardHTML = document.getElementById('statusCounts')?.innerHTML
    const statusCountCardContainer = exportWindow.document.getElementById('statusCountCard')
    const severityCardHTML = document.getElementById('severityCounts')?.innerHTML
    const severityCardContainer = exportWindow.document.getElementById('severityCard')
    const complianceCardHTML = document.getElementById('complianceLevel')?.innerHTML
    const complianceCardcontainer = exportWindow.document.getElementById('complianceCard')
    if(statusCardHTML && severityCardHTML && complianceCardHTML) {
      // Append the HTML to each container
      statusCountCardContainer?.insertAdjacentHTML('afterbegin', statusCardHTML)
      severityCardContainer?.insertAdjacentHTML('afterbegin', severityCardHTML)
      complianceCardcontainer?.insertAdjacentHTML('afterbegin', complianceCardHTML)
      // There seems to be some sort of automatic formatting applied with .resize-triggers that doesn't apply here
      const elements = exportWindow.document.getElementsByClassName('resize-triggers');
      while (elements[0]) {
        const element = elements[0];
        element?.parentNode?.removeChild(element);
      }
    }
  }

    addDetails(control: ContextualizedControl): ContextualizedControl & {details: Detail[]} {
      return {...control, full_code: control.full_code, details: [
      {
        name: 'Control',
        value: control.data.id
      },
      {
        name: 'Title',
        value: control.data.title
      },
      {
        name: 'Caveat',
        value: control.hdf.descriptions.caveat
      },
      {
        name: 'Desc',
        value: control.data.desc
      },
      {
        name: 'Rationale',
        value: control.hdf.descriptions.rationale
      },
      {
        name: 'Justification',
        value: control.hdf.descriptions.justification
      },
      {
        name: 'Severity',
        value: control.root.hdf.severity
      },
      {
        name: 'Impact',
        value: control.data.impact
      },
      {
        name: 'Nist controls',
        value: control.hdf.raw_nist_tags.join(', ')
      },
      {
        name: 'Check Text',
        value: control.hdf.descriptions.check || control.data.tags.check
      },
      {
        name: 'Fix Text',
        value: control.hdf.descriptions.fix || control.data.tags.fix
      }
    ].filter((v) => v.value)}
  }

  exportHTML(): void {
    this.resetOutputData();
    if(this.filter.fromFile.length === 0){
      return SnackbarModule.failure('No files have been loaded.')
    }
    // Download the template
    axios.get(`/static/export/template.html`).then(({data}) => {
      axios.get(`/static/export/style.css`).then((styleResponse) => {
        axios.get(`/static/export/bootstrap.js`).then((bootstrapJsResponse) => {
          axios.get(`/static/export/jquery.js`).then((jqueryResponse) => {
              this.filter.fromFile.forEach(async (fileId) => {
              const file = InspecDataModule.allFiles.find(
                (f) => f.unique_id === fileId
              );
              if (file) {
                this.addFiledata(file)
              }
            })
            const modifiedStyle = styleResponse.data
              .replace(/\#dc3545/g, "#f34335") // bg-danger
              .replace(/\#198754/g, "#4cb04f") // bg-success
              .replace(/\#17a2b8/g, "#03a9f4") // bg-info
              .replace(/\#ffc107/g, "#fe9900") // bg-warning
            const exportWindow = window.open('', '_blank');
            if(exportWindow) {
              exportWindow.document.write(Mustache.render(data, this.outputData))
              exportWindow.document.head.insertAdjacentHTML("beforeend", `<style>${modifiedStyle}</style>`)
              exportWindow.document.write(`<script>${jqueryResponse.data}<\/script>`);
              exportWindow.document.write(`<script>${bootstrapJsResponse.data}<\/script>`);
              this.copyComplianceCards(exportWindow)
            } else {
              SnackbarModule.failure('Please allow pop-up tabs to export to HTML.')
            }
          })
        })
      })
    })
    this.closeModal()
  }
}
</script>
