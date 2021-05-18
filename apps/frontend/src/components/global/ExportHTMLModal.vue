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
import {HDFControlSegment} from 'inspecjs';

interface Detail {
  name: string;
  value: string;
  class?: string;
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

  @Watch('exportType')
  onFileChanged(newValue: string, _oldValue: string) {
    switch (newValue) {
      case 'executive':
        this.description = "Profile Info\nStatuses\nCompliance Donuts";
        break;
      case 'manager':
        this.description = "Profile Info\nStatuses\nCompliance Donuts\nTest Results and Details";
        break;
      case 'administrator':
        this.description = "Profile Info\nStatuses\nCompliance Donuts\nTest Results and Details\nTest Code";
        break
    }
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
  createResultsSetElement(template: HTMLTemplateElement, file: EvaluationFile | ProfileFile): Node {
    const templateNode: Node = template.content.cloneNode(true);
    // Add the filename
    const fileNameElement = document.createElement("span")
    fileNameElement.innerHTML = `Filename: <strong>${file.filename}</strong><br />`
    templateNode.childNodes[1].appendChild(fileNameElement)
    // This info is only defined if we're exporting a result, not a profile
    if(this.fileType === 'results'){
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
    }
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
        const element = elements[0];
        element?.parentNode?.removeChild(element);
      }
    }
  }

  /* Creates a table row row for the control results table */
  createControlResultRow(result: HDFControlSegment): HTMLTableRowElement {
    const controlTestResultElement = document.createElement("tr")
    // Create TD elements for each status, test description, and result
    const controlStatusTableDataElement = document.createElement("td");
    const controlStatusTableNode = document.createTextNode(result.status);
    const controlTestTableDataElement = document.createElement("td");
    const controlTestTableNode = document.createTextNode(result.code_desc);
    const controlResultTableDataElement = document.createElement("td");
    const controlResultTableNode = document.createTextNode((result.message || result.skip_message || ''))
    // Append the text nodes to their respective TR
    controlStatusTableDataElement.appendChild(controlStatusTableNode)
    controlTestTableDataElement.appendChild(controlTestTableNode)
    controlResultTableDataElement.appendChild(controlResultTableNode)
    // Put each TD inside the TR
    controlTestResultElement.appendChild(controlStatusTableDataElement)
    controlTestResultElement.appendChild(controlTestTableDataElement)
    controlTestResultElement.appendChild(controlResultTableDataElement)
    return controlTestResultElement
  }

  createDetailRow(detail: Detail): HTMLTableRowElement {
    // Create a table row for each detail
    const detailRow = document.createElement("tr")
    // Create the detail name column
    const detailNameTableDataElement = document.createElement("td");
    const detailNameTableNode = document.createTextNode(detail.name)
    detailNameTableDataElement.appendChild(detailNameTableNode)
    // Create the detail value column
    const detailValueTableDataElement = document.createElement("td")
    const detailValueTableNode = document.createTextNode(detail.value)
    detailValueTableDataElement.appendChild(detailValueTableNode)
    // Put the columns into the table row
    detailRow.appendChild(detailNameTableDataElement)
    detailRow.appendChild(detailValueTableDataElement)
    return detailRow
  }

  /* Adds control sets and controls */
  createControlSet(controlSetTemplate: HTMLTemplateElement, controlTemplate: HTMLTemplateElement, file: EvaluationFile | ProfileFile): Node {
    const templateNode: Node = controlSetTemplate.content.cloneNode(true);
    const templateHTML = controlSetTemplate.innerHTML
    const controlSetElement = document.createElement("div")
    templateNode.textContent = ""
    controlSetElement.innerHTML = templateHTML.replace(/{{ filename }}/g, file.filename);
    controlSetElement.innerHTML = controlSetElement.innerHTML.replace(/{{ fileID }}/g, file.unique_id);
    templateNode.appendChild(controlSetElement)

    const controls = FilteredDataModule.controls({fromFile: [file.unique_id]});
    const hitIds = new Set();
    // Convert them into rows
    for (const ctrl of controls) {
      const root = ctrl.root;
      if (!hitIds.has(root.hdf.wraps.id)) {
        hitIds.add(root.hdf.wraps.id);
        const controlTemplateNode = controlTemplate.content.cloneNode();
        const controlTemplateHTML = controlTemplate.innerHTML;
        const controlElement = document.createElement("div")
        controlTemplateNode.textContent = "";
        const controlresults = root.hdf.segments;

        // Replace the template strings with the actual data
        controlElement.innerHTML = controlTemplateHTML
            .replace('{{ controlId }}', root.hdf.wraps.id)
            .replace(/{{ controlTitle }}/g, root.hdf.wraps.title || '')
            .replace(/{{ controlDescription }}/g, (root.data.desc || 'No description').trim())
        let deleteControlTestResultTable = false;
        if(this.fileType === 'results') {
          controlresults?.forEach((result) => {
            // Create a table row for each result
            const controlTableResultRow = this.createControlResultRow(result)
            // Append the new row to to the control test result table
            controlElement.childNodes[1].childNodes[3].childNodes[1].parentElement?.querySelector("#testResultsTable")?.appendChild(controlTableResultRow)
          })
        } else {
          // Handle controls without any results (e.g exporting a profile or a run error)
          // We just delete the table to give more room for the details table
          deleteControlTestResultTable = true;
        }
        this.getDetails(root).forEach((detail) => {
          // Create the HTML row for the detail
          const detailRow = this.createDetailRow(detail)
          // Append that to the details table
          controlElement.childNodes[1].childNodes[3].childNodes[1].parentElement?.querySelector('#controlDetailsTable')?.appendChild(detailRow)
        })
        // Add control code if were are making an administrator report
        const controlCode = this.exportType === 'administrator' ? root.full_code : ''
        controlElement.innerHTML = controlElement.innerHTML.replace(/{{ code }}/g, controlCode)
        // Once we've added all our details, we can remove the control test results table if determined earlier
        if(deleteControlTestResultTable) {
          controlElement.childNodes[1].childNodes[3].childNodes[1].childNodes[1].childNodes[1].remove()
        }
        templateNode.childNodes[0].childNodes[1].childNodes[1].childNodes[3].appendChild(controlElement)
      }
    }
    return templateNode
  }

  getDetails(control: ContextualizedControl): Detail[] {
    return [
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
    ].filter((v) => v.value); // Get rid of nulls
  }

  exportHTML(): void {
    if(this.filter.fromFile.length === 0){
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
        // Add the bootstrap framework
        axios.get(`/static/export/style.css`).then((response) => {
          exportWindow.document.head.insertAdjacentHTML("beforeend", `<style>${response.data}</style>`)
        })
        // Get the template for results sets
        const profileInfos = exportWindow.document.getElementById('profileInfos');
        const profileInfoTemplate = exportWindow.document.getElementsByTagName('template')[0];
        // Get the template for the control set accordion and control sets
        const resultsSetContainer = exportWindow.document.getElementById('resultSetsContainer');
        const resultsSetAccordionTemplate = exportWindow.document.getElementsByTagName('template')[1];
        const controlTemplate = exportWindow.document.getElementsByTagName('template')[2];
        let copiedComplianceCards = false;

        // For each result set, add to
        this.filter.fromFile.forEach(async (fileId) => {
          const file = InspecDataModule.allFiles.find(
            (f) => f.unique_id === fileId
          );
          if (file) {
            profileInfos?.appendChild(this.createResultsSetElement(profileInfoTemplate, file));
            this.createStatusCardsTemplate(exportWindow)
            // Only copy compliance cards once
            if(!copiedComplianceCards) {
              this.copyComplianceCards(exportWindow)
              copiedComplianceCards = true
            }
            resultsSetContainer?.appendChild(this.createControlSet(resultsSetAccordionTemplate, controlTemplate, file))
          }
        })
        exportWindow.document.close();
        exportWindow.focus();
      } // User has popups disabled
      else {
        SnackbarModule.failure('Please allow pop-up tabs to export to HTML.')
      }
    })
    this.closeModal()
  }
}
</script>
