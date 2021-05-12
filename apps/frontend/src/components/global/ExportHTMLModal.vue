<template>
  <v-dialog v-model="showingModal" width="600">
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
        <v-radio-group v-model="exportType" row>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-radio
                v-bind="attrs"
                label="Executive Report"
                value="executive"
                v-on="on"
              />
            </template>
            <span
              ><ul>
                <li>Profile Info</li>
                <li>Statuses</li>
                <li>Compliance Donuts</li>
              </ul></span
            >
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-radio
                v-bind="attrs"
                label="Manager Report"
                value="manager"
                v-on="on"
              />
            </template>
            <span
              ><ul>
                <li>Everything from Executive Report</li>
                <li>Test Results</li>
                <li>Test Details</li>
              </ul></span
            >
          </v-tooltip>
          <v-tooltip top>
            <template #activator="{ on, attrs }">
              <v-radio
                v-bind="attrs"
                label="Administrator Report"
                value="administrator"
                v-on="on"
              />
            </template>
            <span
              ><ul>
                <li>Everything from Manager Report</li>
                <li>Test Code</li>
              </ul></span
            >
          </v-tooltip>
        </v-radio-group>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="close_modal"> Cancel </v-btn>
        <v-btn color="primary" :disabled="!exportType" text @click="exportHTML">
          Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Modal from '@/components/global/Modal.vue';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import Vue from 'vue';
import {Filter, FilteredDataModule} from '../../store/data_filters';
import {Prop} from 'vue-property-decorator';
import {SnackbarModule} from '../../store/snackbar';
import {InspecDataModule} from '../../store/data_store';
import axios from 'axios';
import _ from 'lodash';
import {StatusCountModule} from '../../store/status_counts';
import { EvaluationFile, ProfileFile } from '../../store/report_intake';

@Component({
  components: {
    LinkItem,
    Modal
  }
})

export default class ExportHTMLModal extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  showingModal: boolean = false;
  exportType: string = '';
  /**
   * Invoked when file(s) are loaded.
   */
  close_modal() {
    this.showingModal = false;
  }
  showModal() {
    this.showingModal = true;
  }

  /* Creates HTML Element Fragments */
  createFragment(exportWindow: Window, htmlStr: string): DocumentFragment {
    var frag = exportWindow.document.createDocumentFragment(),
        temp = exportWindow.document.createElement('div');
    temp.innerHTML = htmlStr;
    while (temp.firstChild) {
        frag.appendChild(temp.firstChild);
    }
    return frag;
  }

  /* Adds profile info */
  createResultsSetElement(template: any, file: any): Node {
    const templateNode: Node = template.content.cloneNode(true);
    // Add the filename
    const fileNameElement = document.createElement("span")
    fileNameElement.innerHTML = `Filename: <strong>${file.filename}</strong><br />`
    templateNode.childNodes[1].appendChild(fileNameElement)
    // Add the tool version
    const toolVersionElement = document.createElement("span")
    toolVersionElement.innerHTML = `Tool Version: <strong>${_.get(file, 'evaluation.data.version')}</strong><br />`
    templateNode.childNodes[1].appendChild(toolVersionElement)
    // Add the run platform
    const platformElement = document.createElement("span")
    platformElement.innerHTML = `Platform: <strong>${_.get(file, 'evaluation.data.platform.name') + _.get(file, 'evaluation.data.platform.release')}</strong><br />`
    templateNode.childNodes[1].appendChild(platformElement)
    // Add the run duration
    const durationElement = document.createElement("span")
    durationElement.innerHTML = `Duration: <strong>${_.get(file, 'evaluation.data.statistics.duration')}</strong>`
    templateNode.childNodes[1].appendChild(durationElement)
    return templateNode
  }

  /* Adds status count cards */
  createStatusCardsTemplate(exportWindow: Window): void {
    const passedCountElement = exportWindow.document.getElementById('passedCount')
    const passedCountSubtitleElement = exportWindow.document.getElementById('passedCountSubtitle')
    const failedCountElement = exportWindow.document.getElementById('failedCount')
    const failedCountSubtitleElement = exportWindow.document.getElementById('failedCountSubtitle')
    const naCountElement = exportWindow.document.getElementById('naCount')
    const nrCountElement = exportWindow.document.getElementById('nrCount')
    if(passedCountElement && passedCountSubtitleElement){
      passedCountElement.textContent = `Passed: ${StatusCountModule.countOf(this.filter, 'Passed')}`
      passedCountSubtitleElement.textContent = `${StatusCountModule.countOf(this.filter, 'PassedTests')} individual checks passed`
    }
    if (failedCountElement && failedCountSubtitleElement) {
      failedCountElement.textContent = `Failed: ${StatusCountModule.countOf(this.filter, 'Failed')}`
      failedCountSubtitleElement.textContent = `${StatusCountModule.countOf(
          this.filter,
          'PassingTestsFailedControl'
        )} individual checks passed, ${StatusCountModule.countOf(
          this.filter,
          'FailedTests'
        )} failed out of ${StatusCountModule.countOf(
          this.filter,
          'PassingTestsFailedControl'
        ) + StatusCountModule.countOf(
          this.filter,
          'FailedTests'
        )} total checks`
    }
    if (naCountElement) {
      naCountElement.textContent = `Not Applicable: ${StatusCountModule.countOf(this.filter, 'Not Applicable')}`
    }
    if (nrCountElement) {
      nrCountElement.textContent = `Not Reviewed: ${StatusCountModule.countOf(this.filter, 'Not Reviewed')}`
    }
  }

  /* Copies the complianceCards from the results view */
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
      while(elements[0]) {
        const element = elements[0]
        element?.parentNode?.removeChild(element);
      }​
    }
  }

  /* Adds control sets and controls */
  createControlSet(exportWindow: Window, template: HTMLTemplateElement, file: EvaluationFile | ProfileFile): Node {
    const controls = FilteredDataModule.controls({fromFile: [file.unique_id]});
    console.log(file)
    template.innerHTML = template.innerHTML.replace('{{ filename }}', file.filename)
    exportWindow.document.querySelector('body')?.insertAdjacentHTML('afterend', template.innerHTML)
    const hitIds = new Set();
      // Convert them into rows
      for (const ctrl of controls) {
        const root = ctrl.root
        if (hitIds.has(root.hdf.wraps.id)) {
          continue;
        } else {
          hitIds.add(root.hdf.wraps.id);
        }
      }

    return template
  }

  exportHTML() {
    if(this.filter.fromFile.length == 0){
      return SnackbarModule.failure('No files have been loaded.')
    }
    // Download the template
    axios.get(`/static/export/${this.exportType}.html`).then(({data}) => {
      // Create a new window where we will build the template
      const exportWindow = window.open('', '_blank');
      exportWindow?.focus()
      // If we successfully created the window
      if (exportWindow) {
        // Write the initial template
        exportWindow.document.write(data);
        // Get the template for results sets
        const resultsSets = exportWindow.document.getElementById('resultsSets');
        const resultsSetTemplate = exportWindow.document.getElementsByTagName('template')[0];
        // Get the template for the control set accordion and control sets
        const resultsSetAccordionTemplate = exportWindow.document.getElementsByTagName('template')[1];
        const controlTemplate = exportWindow.document.getElementsByTagName('template')[2];
        let copiedComplianceCards = false;

        // For each result set, add to
        this.filter.fromFile.forEach((fileId) => {
          const file = InspecDataModule.allFiles.find(
            (f) => f.unique_id === fileId
          );
          if (file && exportWindow) {
            resultsSets?.appendChild(this.createResultsSetElement(resultsSetTemplate, file));
            this.createStatusCardsTemplate(exportWindow)
            // Only copy compliance cards once
            if(!copiedComplianceCards) {
              this.copyComplianceCards(exportWindow)
              copiedComplianceCards = true
            }
            this.createControlSet(exportWindow, resultsSetAccordionTemplate, file)
          }
        })
        exportWindow.document.close();
        exportWindow.focus();
      } // User has popups disabled
      else {
      SnackbarModule.failure('Please allow pop-up tabs to export HTML.')
    }}
    )
  }
}
</script>
