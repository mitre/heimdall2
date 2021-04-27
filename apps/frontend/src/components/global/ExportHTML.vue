<template>
  <v-tooltip top>
    <template #activator="{on}">
      <LinkItem
        key="export_html"
        text="Export as HTML"
        icon="mdi-json"
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

@Component({
  components: {
    LinkItem
  }
})
export default class ExportHTML extends Vue {
  @Prop({type: Object, required: true}) readonly filter!: Filter;

  createResultsSetElement(template: any, file: any): Node {
    let templateNode: Node = template.content.cloneNode(true);
    // Add the filename
    let fileNameElement = document.createElement("span")
    fileNameElement.innerHTML = `Filename: <strong>${file.filename}</strong><br />`
    templateNode.childNodes[1].appendChild(fileNameElement)
    // Add the tool version
    let toolVersionElement = document.createElement("span")
    toolVersionElement.innerHTML = `Tool Version: <strong>${_.get(file, 'evaluation.data.version')}</strong><br />`
    templateNode.childNodes[1].appendChild(toolVersionElement)
    // Add the run platform
    let platformElement = document.createElement("span")
    platformElement.innerHTML = `Platform: <strong>${_.get(file, 'evaluation.data.platform.name') + _.get(file, 'evaluation.data.platform.release')}</strong><br />`
    templateNode.childNodes[1].appendChild(platformElement)
    // Add the run duration
    let durationElement = document.createElement("span")
    durationElement.innerHTML = `Duration: <strong>${_.get(file, 'evaluation.data.statistics.duration')}</strong>`
    templateNode.childNodes[1].appendChild(durationElement)
    return templateNode
  }

  createStatusCardsTemplate(exportWindow: Window): void {
    let passedCountElement = exportWindow.document.getElementById('passedCount')
    let passedCountSubtitleElement = exportWindow.document.getElementById('passedCountSubtitle')
    let failedCountElement = exportWindow.document.getElementById('failedCount')
    let failedCountSubtitleElement = exportWindow.document.getElementById('failedCountSubtitle')
    let naCountElement = exportWindow.document.getElementById('naCount')
    let nrCountElement = exportWindow.document.getElementById('nrCount')
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

  exportHTML(){
    axios.get('/static/export/executive.html').then(({data}) => {
    let exportWindow = window.open('', '', 'height=650,width=1080,top=100,left=150');
    if (exportWindow) {
      exportWindow.document.write(data);
      const resultsSets = exportWindow.document.getElementById('resultsSets');
      const resultsSetTemplate = exportWindow.document.getElementsByTagName('template')[0];
      this.filter.fromFile.forEach((fileId) => {
        const file = InspecDataModule.allFiles.find(
          (f) => f.unique_id === fileId
        );
        if (file && exportWindow) {
          resultsSets?.appendChild(this.createResultsSetElement(resultsSetTemplate, file));
          this.createStatusCardsTemplate(exportWindow)
        }
      })
      exportWindow.document.close();
      exportWindow.focus();
    } else {
      alert("Failed")
    }}
    )
  }
}
</script>
