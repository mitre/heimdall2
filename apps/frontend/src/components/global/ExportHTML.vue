<template>
  <v-tooltip top>
    <template #activator="{on}">
      <LinkItem
        key="export_html"
        text="Export as HTML"
        icon="mdi-language-html5"
        @click="exportHTML()"
        v-on="on"
      />
    </template>
    <span>HTML Download</span>
  </v-tooltip>
</template>
<script lang="ts">
import Vue from 'vue'
import axios from 'axios';
import Component from 'vue-class-component';
import LinkItem from '@/components/global/sidebaritems/IconLinkItem.vue';
import {Prop} from 'vue-property-decorator';
import {Filter} from '../../store/data_filters';
import {InspecDataModule} from '../../store/data_store';
import _ from 'lodash';
import {StatusCountModule} from '../../store/status_counts';
import {SnackbarModule} from '../../store/snackbar';

@Component({
  components: {
    LinkItem
  }
})
export default class ExportHTML extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

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

  exportHTML(){
    if(this.filter.fromFile.length == 0){
      return SnackbarModule.failure('No files have been loaded.')
    }
    // Download the template
    axios.get('/static/export/executive.html').then(({data}) => {
      // Create a new window where we will build the template
      const exportWindow = window.open('', '', 'height=650,width=1080,top=100,left=150');
      // If we successfully created the window
      if (exportWindow) {
        // Write the initial template
        exportWindow.document.write(data);
        // Get the template for results sets
        const resultsSets = exportWindow.document.getElementById('resultsSets');
        const resultsSetTemplate = exportWindow.document.getElementsByTagName('template')[0];
        // For each result set, add
        this.filter.fromFile.forEach((fileId) => {
          const file = InspecDataModule.allFiles.find(
            (f) => f.unique_id === fileId
          );
          if (file && exportWindow) {
            resultsSets?.appendChild(this.createResultsSetElement(resultsSetTemplate, file));
            this.createStatusCardsTemplate(exportWindow)
          }
        })
        this.copyComplianceCards(exportWindow)
        exportWindow.document.close();
        exportWindow.focus();
      } // User has popups disabled
      else {
      SnackbarModule.failure('Please allow pop-ups to export HTML.')
    }}
    )
  }
}
</script>
